'use server';

/**
 * @fileOverview A voice query processing AI agent.
 *
 * - voiceQueryProcess - A function that handles the voice query process.
 * - VoiceQueryProcessInput - The input type for the voiceQueryProcess function.
 * - VoiceQueryProcessOutput - The return type for the voiceQueryProcess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceQueryProcessInputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI from user speech'),
});
export type VoiceQueryProcessInput = z.infer<typeof VoiceQueryProcessInputSchema>;

const VoiceQueryProcessOutputSchema = z.object({
  userText: z.string().describe('The text from the user.'),
  aiText: z.string().describe('The AI response in text format.'),
  aiAudioUrl: z.string().optional().describe('Optional audio URL for AI response'),
});
export type VoiceQueryProcessOutput = z.infer<typeof VoiceQueryProcessOutputSchema>;

export async function voiceQueryProcess(input: VoiceQueryProcessInput): Promise<VoiceQueryProcessOutput> {
  return voiceQueryProcessFlow(input);
}

const voiceQueryProcessFlow = ai.defineFlow(
  {
    name: 'voiceQueryProcessFlow',
    inputSchema: VoiceQueryProcessInputSchema,
    outputSchema: VoiceQueryProcessOutputSchema,
  },
  async (input) => {
    const { audioDataUri } = input;

    try {
        // For now, return a placeholder since we don't have actual speech-to-text
        // In a real implementation, you would transcribe the audio here
        const userText = "I said something via voice (Speech-to-text not implemented yet)";
        
        console.log('User audio received, simulating transcription...');
        
        // Check if Google API key is configured
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
            console.error('Google API key not configured!');
            return {
                userText: "Voice message",
                aiText: "⚠️ Google API key is missing! Please add your Google API key to the .env.local file. Get a free key at: https://aistudio.google.com/app/apikey",
            };
        }
        
        // Generate AI response using Genkit with Gemini
        const { text: aiText } = await ai.generate({
            prompt: `You are AssureAI, a helpful and professional insurance assistant. You're helping users with insurance-related questions. Since voice transcription is not yet implemented, respond by acknowledging this and offering text-based help instead. Be friendly and informative.`,
            config: {
                temperature: 0.7,
                maxOutputTokens: 300,
            }
        });

        console.log('AI Response:', aiText);

        return { userText, aiText };

    } catch (error: any) {
        console.error("Error in voice processing flow:", error);
        
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Check for common API errors
        if (error.message && error.message.includes('API key')) {
            errorMessage = 'Invalid or missing Google API key. Please check your .env.local file.';
        } else if (error.message && error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please check your Google AI Studio quota.';
        }
        
        return {
            userText: "Voice message",
            aiText: `I apologize, but I encountered an error: ${errorMessage}. Please try using text input instead.`,
        };
    }
  }
);

