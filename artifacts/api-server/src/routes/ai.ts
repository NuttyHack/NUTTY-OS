import { Router } from "express";

const router = Router();

// Fallback list if dynamic ListModels endpoint is unreachable
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
];

router.post("/chat", async (req, res) => {
  const { prompt, osContext, ambientTrigger } = req.body;

  const systemPrompt = `
You are Nutty, an autonomous, highly intelligent personal operating system assistant (like JARVIS).
You speak naturally, concisely, and conversationally out loud via text-to-speech.

CURRENT OS CONTEXT:
- Calendar Events: ${JSON.stringify(osContext?.calendar || [])}
- Unread Emails: ${JSON.stringify(osContext?.emails || [])}
- Active Tasks: ${JSON.stringify(osContext?.tasks || [])}
- Social Updates: ${JSON.stringify(osContext?.socials || [])}

GUIDELINES:
1. Keep spoken responses brief, human, and direct (1-2 sentences max).
2. Never sound robotic or output markdown code blocks.
`;

  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.json({ text: "My GEMINI_API_KEY is missing in Render environment variables, sir." });
    }

    const apiKey = rawApiKey.trim();
    let candidateModels: string[] = [];

    // 1. Ask Google directly which models this API key supports right now
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (listRes.ok) {
        const listData: any = await listRes.json();
        const available = (listData?.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""));

        if (available.length > 0) {
          candidateModels = available;
          console.log("[Gemini ListModels] Dynamically discovered supported models:", candidateModels);
        }
      }
    } catch (e) {
      console.warn("[Gemini ListModels] Failed to fetch dynamic model list, using defaults:", e);
    }

    // Use fallback models if dynamic discovery returned nothing
    if (candidateModels.length === 0) {
      candidateModels = FALLBACK_MODELS;
    }

    let replyText = "";
    let lastError = "";

    // 2. Try candidate models until one succeeds
    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt || ambientTrigger || "Hello"}` }],
                },
              ],
            }),
          }
        );

        const data: any = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          console.log(`[Gemini AI Success] Successfully connected using model: ${model}`);
          break; // Stop loop on first successful generation
        } else {
          lastError = data?.error?.message || `HTTP ${response.status}`;
          console.warn(`[Gemini AI Model ${model} skipped]:`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || "Network request failed";
      }
    }

    if (!replyText) {
      return res.json({ text: `Neural network error: ${lastError}` });
    }

    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("[AI Catch Error]:", error);
    return res.json({ text: `Processing delay: ${error?.message || "Unknown error"}` });
  }
});

export default router;