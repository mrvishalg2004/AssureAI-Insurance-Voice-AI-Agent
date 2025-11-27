import BulkCallQueue from '../models/BulkCallQueue';
import { triggerOutboundCall, formatPhoneNumber } from '../services/bolna';

// Track active processors per user to avoid duplicate processing
const activeProcessors = new Map<string, boolean>();

// Delay between calls to avoid rate limiting (in milliseconds)
const CALL_DELAY = 2000; // 2 seconds

// Maximum concurrent calls processing per user
const MAX_CONCURRENT_CALLS = 5;

/**
 * Process pending calls in queue for a specific user
 */
export async function processCallQueue(userId: string): Promise<void> {
  // Check if processor is already running for this user
  if (activeProcessors.get(userId)) {
    console.log(`⏳ Call processor already running for user ${userId}`);
    return;
  }

  activeProcessors.set(userId, true);
  console.log(`\n🚀 Starting call processor for user ${userId}`);

  try {
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Process in batches to avoid overwhelming the system
    while (true) {
      // Get next batch of pending calls
      const pendingCalls = await BulkCallQueue.find({
        userId,
        status: 'pending',
      })
        .sort({ createdAt: 1 })
        .limit(MAX_CONCURRENT_CALLS);

      if (pendingCalls.length === 0) {
        console.log(`✅ No more pending calls for user ${userId}`);
        break;
      }

      console.log(`📞 Processing batch of ${pendingCalls.length} calls...`);

      // Process calls with delay between each
      for (const call of pendingCalls) {
        try {
          // Update status to processing
          call.status = 'processing';
          call.callAttempts += 1;
          call.lastAttemptAt = new Date();
          await call.save();

          // Format phone number
          const formattedPhone = formatPhoneNumber(call.phone);

          // Trigger outbound call via Bolna
          const result = await triggerOutboundCall(
            formattedPhone,
            call.name,
            userId,
            {
              city: call.city,
              email: call.email,
              notes: call.notes,
            }
          );

          if (result.success && result.callId) {
            // Update call with success
            call.status = 'completed';
            call.bolnaCallId = result.callId;
            call.errorMessage = undefined;
            await call.save();

            successCount++;
            console.log(`✅ Call ${processedCount + 1}: ${call.name} (${call.phone}) - SUCCESS`);
          } else {
            // Update call with failure
            call.status = 'failed';
            call.errorMessage = result.error || 'Unknown error';
            await call.save();

            failedCount++;
            console.log(`❌ Call ${processedCount + 1}: ${call.name} (${call.phone}) - FAILED: ${result.error}`);
          }

          processedCount++;

          // Delay before next call to avoid rate limiting
          if (processedCount < pendingCalls.length) {
            await delay(CALL_DELAY);
          }
        } catch (error: any) {
          console.error(`❌ Error processing call ${call._id}:`, error.message);

          // Update call with error
          call.status = 'failed';
          call.errorMessage = error.message || 'Processing error';
          await call.save();

          failedCount++;
          processedCount++;
        }
      }

      // Brief pause between batches
      await delay(1000);
    }

    console.log(`\n📊 Call processing complete for user ${userId}:`);
    console.log(`   Total processed: ${processedCount}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failedCount}\n`);
  } catch (error: any) {
    console.error(`❌ Call processor error for user ${userId}:`, error.message);
  } finally {
    activeProcessors.delete(userId);
  }
}

/**
 * Process all pending calls across all users (for scheduled jobs)
 */
export async function processAllPendingCalls(): Promise<void> {
  try {
    console.log('\n🔄 Processing all pending calls across all users...');

    // Get unique user IDs with pending calls
    const userIds = await BulkCallQueue.distinct('userId', { status: 'pending' });

    console.log(`Found ${userIds.length} users with pending calls`);

    // Process each user's queue sequentially
    for (const userId of userIds) {
      await processCallQueue(userId);
    }

    console.log('✅ All pending calls processed\n');
  } catch (error: any) {
    console.error('❌ Error processing all pending calls:', error.message);
  }
}

/**
 * Retry failed calls for a specific user
 */
export async function retryFailedCalls(userId: string, maxRetries: number = 3): Promise<void> {
  try {
    console.log(`\n🔄 Retrying failed calls for user ${userId}...`);

    // Reset failed calls that haven't exceeded max retries
    const result = await BulkCallQueue.updateMany(
      {
        userId,
        status: 'failed',
        callAttempts: { $lt: maxRetries },
      },
      {
        $set: { status: 'pending' },
      }
    );

    console.log(`Reset ${result.modifiedCount} failed calls to pending`);

    // Process the queue
    await processCallQueue(userId);
  } catch (error: any) {
    console.error(`❌ Error retrying failed calls for user ${userId}:`, error.message);
  }
}

/**
 * Utility function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get queue statistics for a user
 */
export async function getQueueStats(userId: string) {
  try {
    const stats = await BulkCallQueue.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    stats.forEach(item => {
      summary[item._id as keyof typeof summary] = item.count;
      summary.total += item.count;
    });

    return summary;
  } catch (error: any) {
    console.error('Error getting queue stats:', error.message);
    return null;
  }
}
