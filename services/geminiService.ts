import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { NetworkNode } from "../types";

// Helper to ensure we have a key (though the prompt says assume valid process.env)
const getClient = () => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateThreatNarrative = async (node: NetworkNode): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      You are an accessibility-focused security analyst.
      Translate the following technical node status into a clear, concise narrative suitable for a screen reader or audio summary.
      Focus on the critical risks and simple English explanations. Avoid jargon where possible.
      
      Node Data:
      ${JSON.stringify(node, null, 2)}
      
      Output plain text only. Max 3 sentences.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Description unavailable.";
  } catch (error) {
    console.error("Narrative Gen Error:", error);
    return "Unable to generate narrative at this time.";
  }
};

export const searchThreatIntel = async (query: string): Promise<{ text: string; sources: string[] }> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest security information regarding: ${query}. Summarize key findings.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No results found.";
    
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                sources.push(chunk.web.uri);
            }
        });
    }

    return { text, sources };
  } catch (error) {
    console.error("Search Error:", error);
    return { text: "Error searching threat intelligence.", sources: [] };
  }
};

let chatSession: Chat | null = null;

export const sendMessageToChatbot = async (message: string): Promise<string> => {
  try {
    const ai = getClient();
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: "You are SentinelAI, an advanced security assistant. Help the user analyze network threats, explain vulnerabilities (CVEs), and suggest remediation steps. Be concise and professional.",
        },
      });
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I encountered an error connecting to the security mainframe.";
  }
};

// Simple intent parser for voice commands
export const parseVoiceCommand = async (transcript: string): Promise<string> => {
   try {
    const ai = getClient();
    const prompt = `
      Analyze this voice command for a security dashboard: "${transcript}".
      Return a simple JSON object with an 'intent' field.
      Possible intents: "SELECT_CRITICAL", "SHOW_DETAILS", "ZOOM_IN", "ZOOM_OUT", "READ_SUMMARY", "UNKNOWN".
      If they mention a specific host type (like 'database'), include 'targetType' in the JSON.
    `;
     // Using Flash for speed on simple classification
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text || "{}";
   } catch (e) {
     return "{}";
   }
}
