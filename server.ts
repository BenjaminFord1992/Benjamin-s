import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Helper to get Gemini API Client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in the Secrets panel.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST Endpoint: Get current user info & profile
app.get("/api/user-info", (req, res) => {
  res.json({
    email: "benjaminford831@gmail.com",
    name: "Benjamin Ford",
    avatarColor: "#00ff66", // Neon Grok green
    role: "Premium Human Explorer",
    subscription: "Grok X+ Super Access"
  });
});

// SSE Streaming Route for Grok Chat
app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { messages, mode, deepSearch, imageFile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Invalid chat history format." })}\n\n`);
    res.end();
    return;
  }

  try {
    const ai = getGeminiClient();

    // 1. Send Simulated Realtime Deep Research steps before the answer stream
    // to match Grok's iconic deep search interface
    if (deepSearch) {
      const steps = [
        { id: "step1", text: "Analyzing query and mapping deep-search intents...", duration: 600 },
        { id: "step2", text: "Retrieving web indexes & real-time search grounding...", duration: 800 },
        { id: "step3", text: "Cross-referencing multiple citations and live news events...", duration: 700 },
        { id: "step4", text: `Formatting response with ${mode === "fun" ? "rebellious wit & spicy" : "objective and direct"} synthesis...`, duration: 500 }
      ];

      for (const step of steps) {
        res.write(`data: ${JSON.stringify({ type: "step", id: step.id, text: step.text })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, step.duration));
      }
    } else {
      // Small initialization step for ultra-fast chat
      res.write(`data: ${JSON.stringify({ type: "step", id: "init", text: "Grokking response..." })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 2. Select model and assemble systemInstruction based on selected mode
    // Fun Mode incorporates sarcasm, humor, rebellious flair, xAI personality.
    // Regular Mode is objective, precise, structured.
    const model = "gemini-3.5-flash"; // Highly performant models/gemini-3.5-flash as the standard
    const systemInstruction = mode === "fun"
      ? "You are Grok, an advanced AI created by xAI. You answer inquiries with standard wit, healthy cynicism, playful sarcasm, and a rebellious intellectual streak. You absolute love to make tech roasts, witty side observations, and engaging banter, but you must NEVER sacrifice factual accuracy, logic, or detailed information. Always ensure your explanations are informative, fully fleshed out, and comprehensive, while maintaining an elegant, confident, humorous tone. If asked about being an AI, enthusiastically represent yourself under the name Grok."
      : "You are Grok, an advanced AI created by xAI. In this mode, you are extremely objective, factual, structured, direct, and completely free of sarcasm or fluff. Provide clean, highly precise answers with professional style and outstanding detail.";

    // 3. Construct contents formatting
    // If the latest user message contains an uploaded image base64, attach it to parts
    const formattedContents: any[] = [];
    
    // Convert previous messages to standard roles: 'user', 'model'
    for (let i = 0; i < messages.length - 1; i++) {
      const m = messages[i];
      formattedContents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      });
    }

    // Format the latest message
    const lastMsg = messages[messages.length - 1];
    const latestParts: any[] = [];

    if (imageFile && imageFile.data && imageFile.mimeType) {
      const base64Data = imageFile.data.includes("base64,")
        ? imageFile.data.split("base64,")[1]
        : imageFile.data;
      latestParts.push({
        inlineData: {
          mimeType: imageFile.mimeType,
          data: base64Data
        }
      });
    }

    latestParts.push({ text: lastMsg.content });
    formattedContents.push({
      role: "user",
      parts: latestParts
    });

    // 4. Configure tools - enable googleSearch grounding if deepSearch is true
    const config: any = {
      systemInstruction,
      temperature: mode === "fun" ? 1.05 : 0.7,
    };

    if (deepSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // 5. Query the stream from Gemini
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: formattedContents,
      config,
    });

    let collectedCitations: any[] = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      
      // Grab grounding citations if any are returned
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks)) {
        for (const gc of groundingChunks) {
          if (gc.web && gc.web.uri) {
            collectedCitations.push({
              title: gc.web.title || "Web Source",
              uri: gc.web.uri
            });
          }
        }
      }

      // Stream text chunk
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ type: "text", text: chunkText })}\n\n`);
      }
    }

    // 6. Send final metadata including collected grounding citations
    // Deduplicate citations
    const uniqueCitations = Array.from(new Map(collectedCitations.map(item => [item.uri, item])).values());
    res.write(`data: ${JSON.stringify({ type: "done", citations: uniqueCitations })}\n\n`);
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: error.message || "An unexpected error occurred during grokking." })}\n\n`);
  } finally {
    res.end();
  }
});

// Image Generation Proxy Route using gemini-2.5-flash-image / Fallback
app.post("/api/image/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt parameter." });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    // Call the flash-image model to produce generative arts
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let imageUrl = "";
    
    // Extract base64 image bytes from response candidate parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString: string = part.inlineData.data;
          const mime = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mime};base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ success: true, imageUrl });
    } else {
      throw new Error("No image data found in standard Gemini model response.");
    }
  } catch (error: any) {
    console.error("Image generation failed:", error);
    
    // Graceful error recovery: Return user-friendly status so client can construct a fallback visual component
    res.json({
      success: false,
      error: error.message || "Billing restriction or API limit on visual generation model.",
      fallbackMessage: "Generative model offline. Displaying custom Grok SVG fallback instead.",
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grok full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
