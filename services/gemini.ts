import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

// Initialize the Gemini client
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// OpenRouter API Configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Model mappings
const OPENROUTER_MODELS = {
  [ModelType.LLAMA]: 'meta-llama/llama-3.1-70b-instruct',
  [ModelType.MISTRAL]: 'mistralai/mistral-large',
};

/**
 * Call OpenRouter API for LLaMA and Mistral models
 */
async function callOpenRouter(
  prompt: string,
  modelType: ModelType,
  systemInstruction?: string
): Promise<string> {
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API Key not found. Please add VITE_OPENROUTER_API_KEY to your environment variables.");
  }

  const modelName = OPENROUTER_MODELS[modelType];
  if (!modelName) {
    throw new Error(`No OpenRouter model mapped for ${modelType}`);
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Jainn AI 3.0',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  } catch (error: any) {
    console.error(`OpenRouter API error (${modelType}):`, error);
    throw new Error(error.message || "Failed to generate response from OpenRouter");
  }
}

/**
 * Main function to generate responses from different models
 */
export const generateResponse = async (
  prompt: string, 
  modelType: ModelType = ModelType.GEMINI,
  files?: any[], // ADD THIS PARAMETER
  systemInstruction?: string
): Promise<string> => {
  try {
    if (modelType === ModelType.GEMINI) {
      if (!geminiApiKey || !ai) {
        throw new Error("Gemini API Key not found. Please add VITE_GEMINI_API_KEY to your environment variables.");
      }

      // Build contents array with files
      const contents: any[] = [{ text: prompt }];
      
      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.base64) {
            contents.push({
              inlineData: {
                mimeType: file.type,
                data: file.base64
              }
            });
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction || "You are Gemini, a helpful AI assistant. When files are attached, analyze them thoroughly.",
        }
      });
      
      return response.text || "No response generated.";
      
    } else if (modelType === ModelType.LLAMA) {
      const instruction = systemInstruction || "You are LLaMA 3.1, a helpful and efficient AI assistant created by Meta. Answer with clarity and precision.";
      return await callOpenRouter(prompt, ModelType.LLAMA, instruction);
      
    } else if (modelType === ModelType.MISTRAL) {
      const instruction = systemInstruction || "You are Mistral Large, a concise and precise AI assistant. Answer with accuracy and efficiency.";
      return await callOpenRouter(prompt, ModelType.MISTRAL, instruction);
      
    } else {
      throw new Error(`Unknown model type: ${modelType}`);
    }
  } catch (error: any) {
    console.error("Error generating content:", error);
    
    if (error.message?.includes('API Key not found')) {
      return `⚠️ ${error.message}`;
    }
    return `I encountered an error: ${error.message || 'Please try again.'}`;
  }
};

/**
 * Referee AI analyzes multi-agent responses
 */
export const generateRefereeAnalysis = async (
  query: string,
  responses: { model: string, text: string }[]
): Promise<string> => {
  if (!geminiApiKey || !ai) {
    console.warn("Referee unavailable: No Gemini API Key.");
    return "Referee unavailable (No API Key).";
  }

  const prompt = `
    Analyze the following responses to the user query: "${query}"
    
    Responses:
    ${responses.map(r => `[${r.model}]: ${r.text}`).join('\n\n')}
    
    Task:
    1. Select the best response based on accuracy, completeness, and clarity.
    2. Explain why it is the best in 1-2 sentences.
    3. Point out one improvement for the other responses.
    
    Keep it brief and constructive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Referee analysis error:", error);
    return "Referee system offline.";
  }
};

/**
 * Generate images using Gemini's UPDATED Imagen model - Flash Image 2.0
 * FIXED: Updated to use the latest stable image generation model
 */
export const generateImage = async (prompt: string): Promise<string | null> => {
  if (!geminiApiKey || !ai) {
    throw new Error("Gemini API Key not found. Image generation requires VITE_GEMINI_API_KEY.");
  }
  
  try {
    console.log('🎨 Generating image with Flash Image 2.0...');
    
    // UPDATED: Using the latest image generation model
    // Try gemini-2.5-flash-image first, fallback to imagen-3.0 if needed
    let imageUrl: string | null = null;
    
    try {
      const response = await ai.models.generateImages({
        model: 'gemini-2.5-flash-image', // UPDATED MODEL
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg'
        }
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imageBytes) {
        imageUrl = `data:image/jpeg;base64,${imageBytes}`;
      }
    } catch (flashError) {
      console.warn('Flash Image 2.0 failed, trying Imagen 3.0 fallback...', flashError);
      
      // Fallback to Imagen 3.0
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg'
        }
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imageBytes) {
        imageUrl = `data:image/jpeg;base64,${imageBytes}`;
      }
    }
    
    if (imageUrl) {
      console.log('✅ Image generated successfully');
      return imageUrl;
    }
    
    return null;
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};
