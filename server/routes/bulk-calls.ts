import express, { Router, Response, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import BulkCallQueue from '../models/BulkCallQueue';
import { parseContactFile, findDuplicates } from '../utils/fileParser';
import { processCallQueue } from '../jobs/callProcessor';
import { getCallStatus } from '../services/bolna';

const router: Router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `contacts-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

// All routes require authentication
router.use(authenticateToken);

/**
 * Upload and process bulk call file
 * POST /api/bulk-calls/upload
 */
interface AuthRequestWithFile extends AuthRequest {
  file?: Express.Multer.File;
}

router.post('/upload', upload.single('file'), async (req: AuthRequestWithFile, res: Response) => {
  let filePath: string | undefined;

  try {
    const userId = req.user?.userId;
    const file = req.file;
    const checkDuplicates = req.body.checkDuplicates === 'true';

    if (!file || !file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not found' });
    }

    filePath = file.path;
    console.log(`📁 File uploaded: ${file.originalname} (${file.size} bytes)`);

    // Parse the file
    const parseResult = await parseContactFile(filePath);

    if (!parseResult.success || parseResult.contacts.length === 0) {
      return res.status(400).json({
        error: 'Failed to parse file',
        details: parseResult.errors,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
      });
    }

    // Check for duplicates if requested
    let duplicates: string[] = [];
    if (checkDuplicates) {
      const existingContacts = await BulkCallQueue.find(
        { userId, phone: { $in: parseResult.contacts.map(c => c.phone) } },
        { phone: 1 }
      );
      duplicates = findDuplicates(parseResult.contacts, existingContacts);
    }

    // Save contacts to database
    const contactsToSave = parseResult.contacts.map(contact => ({
      userId,
      name: contact.name,
      phone: contact.phone,
      city: contact.city,
      email: contact.email,
      notes: contact.notes,
      status: 'pending',
      callAttempts: 0,
    }));

    const savedContacts = await BulkCallQueue.insertMany(contactsToSave);

    console.log(`✅ Saved ${savedContacts.length} contacts to database`);

    // Start processing calls in background
    if (userId) {
      processCallQueue(userId).catch(error => {
        console.error('Error starting call processor:', error);
      });
    }

    res.status(201).json({
      message: 'File uploaded and contacts saved successfully',
      summary: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        savedContacts: savedContacts.length,
        errors: parseResult.errors.length,
        duplicatesFound: duplicates.length,
      },
      contacts: savedContacts.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        status: c.status,
      })),
      errors: parseResult.errors,
      duplicates,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process upload',
      details: error.message,
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
    }
  }
});

/**
 * Get all bulk calls for current user
 * GET /api/bulk-calls
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };
    
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [calls, total] = await Promise.all([
      BulkCallQueue.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BulkCallQueue.countDocuments(query),
    ]);

    // Get status summary
    const statusSummary = await BulkCallQueue.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    statusSummary.forEach(item => {
      summary[item._id as keyof typeof summary] = item.count;
      summary.total += item.count;
    });

    res.json({
      calls: calls.map(call => ({
        id: call._id,
        name: call.name,
        phone: call.phone,
        city: call.city,
        email: call.email,
        status: call.status,
        bolnaCallId: call.bolnaCallId,
        errorMessage: call.errorMessage,
        callAttempts: call.callAttempts,
        lastAttemptAt: call.lastAttemptAt,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error: any) {
    console.error('Get bulk calls error:', error);
    res.status(500).json({ error: 'Failed to fetch bulk calls', details: error.message });
  }
});

/**
 * Get a specific call by ID
 * GET /api/bulk-calls/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const call = await BulkCallQueue.findOne({ _id: id, userId });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({
      call: {
        id: call._id,
        name: call.name,
        phone: call.phone,
        city: call.city,
        email: call.email,
        notes: call.notes,
        status: call.status,
        bolnaCallId: call.bolnaCallId,
        errorMessage: call.errorMessage,
        callAttempts: call.callAttempts,
        lastAttemptAt: call.lastAttemptAt,
        metadata: call.metadata,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get call error:', error);
    res.status(500).json({ error: 'Failed to fetch call', details: error.message });
  }
});

/**
 * Retry failed calls
 * POST /api/bulk-calls/retry
 */
router.post('/retry', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { callIds } = req.body;

    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
      return res.status(400).json({ error: 'Call IDs array is required' });
    }

    // Reset failed calls to pending
    const result = await BulkCallQueue.updateMany(
      {
        _id: { $in: callIds },
        userId,
        status: 'failed',
      },
      {
        $set: { status: 'pending' },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'No failed calls found to retry' });
    }

    // Start processing calls in background
    if (userId) {
      processCallQueue(userId).catch(error => {
        console.error('Error starting call processor:', error);
      });
    }

    res.json({
      message: `${result.modifiedCount} calls reset to pending and queued for retry`,
      retriedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Retry calls error:', error);
    res.status(500).json({ error: 'Failed to retry calls', details: error.message });
  }
});

/**
 * Retry all failed calls for user
 * POST /api/bulk-calls/retry-all
 */
router.post('/retry-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Reset all failed calls to pending
    const result = await BulkCallQueue.updateMany(
      { userId, status: 'failed' },
      { $set: { status: 'pending' } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'No failed calls found' });
    }

    // Start processing calls in background
    if (userId) {
      processCallQueue(userId).catch(error => {
        console.error('Error starting call processor:', error);
      });
    }

    res.json({
      message: `${result.modifiedCount} calls reset to pending and queued for retry`,
      retriedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Retry all calls error:', error);
    res.status(500).json({ error: 'Failed to retry calls', details: error.message });
  }
});

/**
 * Delete a call
 * DELETE /api/bulk-calls/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const call = await BulkCallQueue.findOneAndDelete({ _id: id, userId });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ message: 'Call deleted successfully' });
  } catch (error: any) {
    console.error('Delete call error:', error);
    res.status(500).json({ error: 'Failed to delete call', details: error.message });
  }
});

/**
 * Get call interaction details (transcript, recording, etc.)
 * GET /api/bulk-calls/:id/interaction
 */
router.get('/:id/interaction', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const call = await BulkCallQueue.findOne({ _id: id, userId });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    if (!call.bolnaCallId) {
      return res.status(400).json({ error: 'No Bolna execution ID found for this call' });
    }

    // Fetch execution details from Bolna API
    try {
      const executionData = await getCallStatus(call.bolnaCallId);
      
      // Update local database with fetched data
      call.conversationTime = executionData.conversation_time;
      call.transcript = executionData.transcript;
      call.recordingUrl = executionData.telephony_data?.recording_url;
      call.callStatus = executionData.status;
      call.hangupBy = executionData.telephony_data?.hangup_by;
      call.extractedData = executionData.extracted_data;
      await call.save();

      res.json({
        callId: call._id,
        name: call.name,
        phone: call.phone,
        status: call.status,
        conversationTime: executionData.conversation_time,
        transcript: executionData.transcript,
        recordingUrl: executionData.telephony_data?.recording_url,
        callStatus: executionData.status,
        hangupBy: executionData.telephony_data?.hangup_by,
        hangupReason: executionData.telephony_data?.hangup_reason,
        extractedData: executionData.extracted_data,
        costBreakdown: executionData.cost_breakdown,
        createdAt: executionData.created_at,
        updatedAt: executionData.updated_at,
      });
    } catch (bolnaError: any) {
      console.error('Failed to fetch from Bolna:', bolnaError.message);
      
      // Return cached data if available
      if (call.transcript || call.recordingUrl) {
        res.json({
          callId: call._id,
          name: call.name,
          phone: call.phone,
          status: call.status,
          conversationTime: call.conversationTime,
          transcript: call.transcript,
          recordingUrl: call.recordingUrl,
          callStatus: call.callStatus,
          hangupBy: call.hangupBy,
          extractedData: call.extractedData,
          cached: true,
        });
      } else {
        res.status(500).json({ error: 'Failed to fetch call details from Bolna', details: bolnaError.message });
      }
    }
  } catch (error: any) {
    console.error('Get call interaction error:', error);
    res.status(500).json({ error: 'Failed to get call interaction', details: error.message });
  }
});

export default router;
