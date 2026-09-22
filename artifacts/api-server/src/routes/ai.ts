import { Router } from "express";

const router = Router();

const PREFERRED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

// Dynamically check which models are enabled for this API key
async function getAvailableModel(apiKey: string): Promise<string> {
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (listRes.ok) {
      const data: any = await listRes.json();
      const models: any[] = data.models || [];

      const generateModels = models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace("models/", ""));

      if (generateModels.length > 0) {
        const matched = PREFERRED_MODELS.find((p) => generateModels.includes(p));
        return matched || generateModels[0];
      }
    }
  } catch (e) {
    console.warn("Could not fetch dynamic model list, using fallback:", e);
  }
  return "gemini-2.0-flash";
}

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
    const activeModel = await getAvailableModel(apiKey);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      console.error(`[Gemini Error on ${activeModel}]:`, JSON.stringify(data, null, 2));
      const googleError = data?.error?.message || "Invalid API request";
      return res.json({ text: `Neural network error: ${googleError}` });
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm online and listening, sir.";

    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("[AI Catch Error]:", error);
    return res.json({ text: `Processing delay: ${error?.message || "Unknown error"}` });
  }
});

export default router;