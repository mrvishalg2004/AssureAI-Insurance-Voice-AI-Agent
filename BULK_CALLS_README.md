# Bulk Call Management System

## Overview
This system allows you to upload contact lists (CSV/Excel) and automatically trigger voice calls using the Bolna.ai API.

## Features
- ✅ Upload CSV or Excel files with contact information
- ✅ Automatic file parsing and validation
- ✅ Duplicate detection
- ✅ Automated voice call triggering via Bolna.ai
- ✅ Real-time status tracking
- ✅ Retry failed calls
- ✅ Admin dashboard with filters and search

## Setup

### 1. Bolna.ai Configuration
1. Sign up at [Bolna.ai](https://bolna.dev)
2. Create an agent in your Bolna dashboard
3. Copy your API key and Agent ID
4. Update `.env.local`:
   ```
   BOLNA_API_KEY=your-api-key-here
   BOLNA_AGENT_ID=your-agent-id-here
   ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm run dev:server  # Backend on port 5000
npm run dev         # Frontend on port 3001
```

## Usage

### File Format
Your CSV or Excel file should have these columns:

**Required:**
- `name` - Contact name
- `phone` - Phone number (10-15 digits)

**Optional:**
- `city` - City name
- `email` - Email address
- `notes` - Additional notes

### Example CSV
```csv
name,phone,city,email,notes
John Doe,9876543210,Mumbai,john@example.com,Interested in AI courses
Jane Smith,9876543211,Delhi,jane@example.com,Follow up on enrollment
```

A sample file is provided at `sample-contacts.csv`.

### Upload Process
1. Navigate to **Admin → Bulk Calls** in the sidebar
2. Click "Choose File" or drag and drop your CSV/Excel file
3. Click "Upload and Process"
4. View upload summary with:
   - Total rows processed
   - Valid contacts
   - Saved contacts
   - Errors (if any)
   - Duplicates found

### Call Status
After upload, the system will:
1. **Parse** the file and validate contacts
2. **Save** valid contacts to database
3. **Trigger** automated calls via Bolna.ai (2-second delay between calls)
4. **Track** status: Pending → Processing → Completed/Failed

### Dashboard Features
- **Summary Cards**: View totals for all call statuses
- **Search**: Find contacts by name or phone
- **Filter**: View calls by status (pending, processing, completed, failed)
- **Retry**: Retry individual failed calls or all failed calls
- **Pagination**: Navigate through large contact lists

## API Endpoints

### Upload Contacts
```
POST /api/bulk-calls/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: file (CSV or Excel)
```

### List Calls
```
GET /api/bulk-calls?page=1&limit=50&status=pending&search=john
Authorization: Bearer <token>
```

### Retry Failed Calls
```
POST /api/bulk-calls/retry
Authorization: Bearer <token>
Body: { "callIds": ["id1", "id2"] }
```

### Retry All Failed
```
POST /api/bulk-calls/retry-all
Authorization: Bearer <token>
```

## File Specifications
- **Max Size**: 5 MB
- **Formats**: CSV, XLSX, XLS
- **Column Names**: Case-insensitive, flexible (name/Name/NAME all work)
- **Phone Format**: Automatically formatted to E.164 (with country code)

## Phone Number Validation
- Must be 10-15 digits
- Automatically formatted with +91 country code (India)
- Validates before triggering calls

## Rate Limiting
- **Delay**: 2 seconds between calls
- **Concurrent**: Max 5 calls processed per user batch
- **Retries**: Max 3 attempts for failed calls

## Troubleshooting

### Upload Errors
- **File too large**: Reduce file size to under 5 MB
- **Invalid format**: Use CSV or Excel only
- **Missing columns**: Ensure `name` and `phone` columns exist
- **Invalid phone**: Check phone numbers are 10-15 digits

### Call Failures
- **Bolna API Error**: Verify BOLNA_API_KEY and BOLNA_AGENT_ID in .env.local
- **Rate Limiting**: System automatically handles with 2-second delays
- **Invalid Phone**: Check phone number format in source file

### View Errors
- Failed calls show error messages in the dashboard
- Check browser console for detailed error logs

## Database Schema

### BulkCallQueue Collection
```typescript
{
  userId: ObjectId,          // User who uploaded
  name: string,              // Contact name
  phone: string,             // E.164 formatted phone
  city: string (optional),   // City
  email: string (optional),  // Email
  notes: string (optional),  // Notes
  status: enum,              // pending|processing|completed|failed
  bolnaCallId: string,       // Bolna call ID
  errorMessage: string,      // Error if failed
  callAttempts: number,      // Retry count
  lastAttemptAt: Date,       // Last call attempt
  metadata: object,          // Additional data
  createdAt: Date,
  updatedAt: Date
}
```

## Background Jobs

### Call Processor
The system includes a background job (`/server/jobs/callProcessor.ts`) that:
- Processes pending calls in batches
- Updates call status in real-time
- Implements retry logic for failures
- Prevents duplicate processing

You can manually trigger processing:
```typescript
import { processCallQueue } from './server/jobs/callProcessor';
await processCallQueue(userId);
```

## Security
- All endpoints require JWT authentication
- File uploads are validated for type and size
- Uploaded files are deleted after processing
- Phone numbers are validated before calling

## Support
For issues or questions:
1. Check error messages in the dashboard
2. Review server logs in the terminal
3. Verify Bolna.ai configuration
4. Ensure MongoDB connection is active

## License
MIT
