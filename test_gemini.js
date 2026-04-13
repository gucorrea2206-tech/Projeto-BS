import { GoogleGenAI } from "@google/genai";
try {
  const ai = new GoogleGenAI({ apiKey: undefined });
  await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Hello",
  });
} catch (e) {
  console.log(e.message);
}
