import axios from 'axios';

const BOLNA_API_URL = 'https://api.bolna.ai';

export interface BolnaCallRequest {
  phone: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface BolnaCallResponse {
  success: boolean;
  callId?: string;
  message?: string;
  error?: string;
}

/**
 * Trigger an outbound call via Bolna.ai API
 */
export async function triggerOutboundCall(
  phone: string,
  contactName: string,
  userId: string,
  additionalMetadata?: Record<string, any>
): Promise<BolnaCallResponse> {
  try {
    // Read environment variables inside function after dotenv loads
    const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
    const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID || 'default-agent-id';
    
    if (!BOLNA_API_KEY) {
      throw new Error('BOLNA_API_KEY is not configured in environment variables');
    }
    
    if (!BOLNA_AGENT_ID || BOLNA_AGENT_ID === 'your-bolna-agent-id-here' || BOLNA_AGENT_ID === 'default-agent-id') {
      throw new Error('BOLNA_AGENT_ID is not configured. Please add your Bolna Agent ID to .env.local file. Get it from https://app.bolna.dev');
    }

    // MOCK MODE: If enabled, simulate a successful call without hitting the API
    if (process.env.MOCK_BOLNA_CALLS === 'true') {
      console.log(`⚠️ MOCK MODE ENABLED: Simulating successful call to ${phone}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      return {
        success: true,
        callId: `mock-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: 'Call initiated successfully (MOCK)',
      };
    }

    // Format phone number: Ensure it has country code if it's a 10-digit number (assuming India +91)
    let formattedPhone = phone.trim();
    // Remove any spaces or dashes
    formattedPhone = formattedPhone.replace(/[\s-]/g, '');
    
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        // If it's not 10 digits and doesn't start with +, we might want to warn or just try adding +
        formattedPhone = '+' + formattedPhone;
      }
    }

    console.log(`📞 Triggering Bolna call to ${formattedPhone} (original: ${phone}) (${contactName})...`);
    console.log('Payload:', JSON.stringify({
      agent_id: BOLNA_AGENT_ID,
      recipient_phone_number: formattedPhone,
      user_data: {
        uploadedBy: userId,
        contactName: contactName,
        ...additionalMetadata,
      },
    }, null, 2));

    const response = await axios.post(
      `${BOLNA_API_URL}/call`,
      {
        agent_id: BOLNA_AGENT_ID,
        recipient_phone_number: formattedPhone,
        user_data: {
          uploadedBy: userId,
          contactName: contactName,
          ...additionalMetadata,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    // Bolna API returns execution_id instead of call_id
    if (response.data && (response.data.execution_id || response.data.call_id)) {
      const callId = response.data.execution_id || response.data.call_id;
      console.log(`✅ Call initiated successfully. Call ID: ${callId}`);
      return {
        success: true,
        callId: callId,
        message: 'Call initiated successfully',
      };
    } else {
      console.warn('⚠️ Unexpected response format from Bolna API:', response.data);
      return {
        success: false,
        error: 'Unexpected response format from Bolna API: ' + JSON.stringify(response.data),
      };
    }
  } catch (error: any) {
    console.error('❌ Bolna API call failed:', error.message);
    
    let errorMessage = 'Failed to initiate call';
    
    if (error.response) {
      // API returned an error response
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
      
      const apiError = error.response.data?.message || error.response.data?.error;
      if (apiError) {
        errorMessage = `API Error (${error.response.status}): ${apiError}`;
      } else {
        errorMessage = `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from Bolna API server';
    } else {
      // Error in setting up the request
      errorMessage = `Request setup error: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get call status from Bolna.ai
 */
export async function getCallStatus(callId: string): Promise<any> {
  try {
    // Read environment variable inside function after dotenv loads
    const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
    
    if (!BOLNA_API_KEY) {
      throw new Error('BOLNA_API_KEY is not configured');
    }

    const response = await axios.get(
      `${BOLNA_API_URL}/executions/${callId}`,
      {
        headers: {
          'Authorization': `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to get call status:', error.message);
    throw error;
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Basic validation - starts with country code or valid digit
  return /^[1-9]\d{9,14}$/.test(cleaned);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add + prefix if not present
  if (!phone.startsWith('+')) {
    // Assume India based on length (10 digits)
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  } else {
    // If it already started with +, just ensure the + is kept with the cleaned digits
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}
