import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

// Initialize the client
// Note: In a real app, you might want to lazily initialize this or handle missing keys gracefully in the UI
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateResponse = async (
  prompt: string, 
  modelType: ModelType = ModelType.GEMINI,
  systemInstruction?: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  // Mapping internal model types to Gemini models (Simulating other agents via Gemini for this demo if keys aren't provided)
  // In a real multi-agent backend, you would call Groq/OpenRouter here.
  let modelName = 'gemini-2.5-flash'; 
  let effectiveSystemInstruction = systemInstruction || "";

  if (modelType === ModelType.LLAMA) {
    effectiveSystemInstruction += " You are LLaMA 3.1, a helpful and efficient AI assistant. Answer with the style and tone of LLaMA.";
  } else if (modelType === ModelType.MISTRAL) {
    effectiveSystemInstruction += " You are Mistral Large, a concise and precise AI assistant. Answer with the style of Mistral.";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: effectiveSystemInstruction,
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "I encountered an error processing your request.";
  }
};

export const generateRefereeAnalysis = async (
  query: string,
  responses: { model: string, text: string }[]
): Promise<string> => {
  if (!apiKey) return "Referee unavailable (No API Key).";

  const prompt = `
    Analyze the following responses to the user query: "${query}"
    
    Responses:
    ${responses.map(r => `[${r.model}]: ${r.text}`).join('\n\n')}
    
    Task:
    1. Select the best response.
    2. Explain why it is the best in 1 sentence.
    3. Point out one improvement for the others.
    
    Keep it brief and constructive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    return "Referee system offline.";
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  if (!apiKey) throw new Error("API Key not found");
  
  try {
    // Using Imagen model for generation
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
      return `data:image/jpeg;base64,${imageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};