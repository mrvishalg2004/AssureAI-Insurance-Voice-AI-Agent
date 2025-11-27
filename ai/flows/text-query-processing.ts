'use server';

/**
 * @fileOverview A text query processing AI agent using Google AI.
 *
 * - textQueryProcess - A function that handles the text query process.
 * - TextQueryProcessInput - The input type for the textQueryProcess function.
 * - TextQueryProcessOutput - The return type for the textQueryProcess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextQueryProcessInputSchema = z.object({
  text: z.string().describe('The user text query.'),
});
export type TextQueryProcessInput = z.infer<typeof TextQueryProcessInputSchema>;

const TextQueryProcessOutputSchema = z.object({
  aiText: z.string().describe('The AI response in text format.'),
  aiAudioUrl: z.string().optional().describe('Optional audio URL for AI response'),
});
export type TextQueryProcessOutput = z.infer<typeof TextQueryProcessOutputSchema>;

export async function textQueryProcess(input: TextQueryProcessInput): Promise<TextQueryProcessOutput> {
  return textQueryProcessFlow(input);
}


// Simple in-memory cache to reduce API calls
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const textQueryProcessFlow = ai.defineFlow(
  {
    name: 'textQueryProcessFlow',
    inputSchema: TextQueryProcessInputSchema,
    outputSchema: TextQueryProcessOutputSchema,
  },
  async (input) => {
    const { text } = input;

    try {
        if (!text || text.trim() === '') {
            return {
                aiText: "I'm sorry, I didn't receive any text. Could you please try again?",
            };
        }

        // Check cache first
        const cacheKey = text.toLowerCase().trim();
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached response for:', text);
            return { aiText: cached.response };
        }

        console.log('User query:', text);
        
        // Check if Google API key is configured
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
            console.error('Google API key not configured!');
            return {
                aiText: "⚠️ Google API key is missing! Please add your Google API key to the .env.local file. Get a free key at: https://aistudio.google.com/app/apikey",
            };
        }
        
        // Generate AI response using Genkit with Gemini
        const { text: aiText } = await ai.generate({
            prompt: `You are AssureAI, a helpful and professional insurance assistant. Answer the following question about insurance concisely and professionally. Be friendly, informative, and provide accurate insurance-related advice.\n\nUser Question: ${text}\n\nAssistant Response:`,
            config: {
                temperature: 0.7,
                maxOutputTokens: 300, // Reduced from 500 to save quota
            }
        });

        console.log('AI Response:', aiText);

        // Cache the response
        responseCache.set(cacheKey, { response: aiText, timestamp: Date.now() });
        
        // Clean old cache entries (keep last 50)
        if (responseCache.size > 50) {
            const entries = Array.from(responseCache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            responseCache.clear();
            entries.slice(0, 50).forEach(([key, value]) => responseCache.set(key, value));
        }

        // Note: Audio generation is not implemented yet
        return { aiText };

    } catch (error: any) {
        console.error("Error in text processing flow:", error);
        
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Check for common API errors
        if (error.message && error.message.includes('API key')) {
            errorMessage = 'Invalid or missing Google API key. Please get a new key at: https://aistudio.google.com/app/apikey';
        } else if (error.message && error.message.includes('quota') || error.message.includes('429')) {
            // Provide helpful fallback responses for common insurance questions
            const commonResponses: Record<string, string> = {
                'what is insurance': 'Insurance is a contract where you pay regular premiums to protect yourself financially against unexpected losses or damages. It helps manage risks in life, health, property, and more.',
                'types of insurance': 'Common types include: Life Insurance, Health Insurance, Auto Insurance, Home Insurance, Travel Insurance, and Business Insurance. Each protects against different risks.',
                'life insurance': 'Life insurance provides financial protection to your beneficiaries after your death. Term life is temporary coverage, while whole life provides lifelong protection with cash value.',
                'health insurance': 'Health insurance covers medical expenses like doctor visits, hospital stays, prescriptions, and preventive care. It helps protect you from high healthcare costs.',
            };
            
            const query = text.toLowerCase().trim();
            for (const [key, response] of Object.entries(commonResponses)) {
                if (query.includes(key)) {
                    return { aiText: `📚 ${response}\n\n⚠️ Note: AI quota exceeded. Showing cached response. For detailed answers, please get a new API key at: https://aistudio.google.com/app/apikey` };
                }
            }
            
            errorMessage = 'API quota exceeded. Please wait a few minutes or get a new API key at: https://aistudio.google.com/app/apikey';
        } else if (error.message && error.message.includes('blocked')) {
            errorMessage = 'The request was blocked by safety filters. Please rephrase your question.';
        }
        
        return {
            aiText: `I apologize, but I encountered an error: ${errorMessage}`,
        };
    }
  }
);
