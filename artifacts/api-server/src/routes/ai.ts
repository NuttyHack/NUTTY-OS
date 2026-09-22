import { Router } from "express";

const router = Router();

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      console.error("[Gemini Rejection]:", JSON.stringify(data, null, 2));
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