
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateThought = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a minimalist creative assistant. Provide concise, profound, and elegant responses. Avoid filler words. Structure with clean markdown.",
      temperature: 0.7,
    },
  });
  return response.text || "The void remains silent.";
};

export const generateVisual = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate visualization");
};

export const suggestPrompt = async (): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Suggest a single, evocative, minimalist writing or creative prompt (one sentence max).",
    config: {
      temperature: 0.9,
    }
  });
  return response.text?.trim() || "What lies beneath the surface?";
};
