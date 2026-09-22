import { Router } from "express";

const router = Router();

// List of standard active models to try sequentially
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite",
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
    let replyText = "";
    let lastError = "";

    // Try each model until one succeeds with a 200 OK response
    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
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
          console.log(`[Gemini AI Success] Used model: ${model}`);
          break; // Stop execution on first success
        } else {
          lastError = data?.error?.message || `HTTP ${response.status}`;
          console.warn(`[Gemini AI] Model ${model} skipped:`, lastError);
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