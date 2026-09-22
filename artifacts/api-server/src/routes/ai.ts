import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  const { prompt, osContext, ambientTrigger } = req.body;

  // Construct system prompt with full live context
  const systemPrompt = `
You are Nutty, an autonomous, highly intelligent personal operating system assistant (like JARVIS).
You speak naturally, concisely, and conversationally out loud via text-to-speech.

CURRENT OS CONTEXT:
- Calendar Events: ${JSON.stringify(osContext?.calendar || [])}
- Unread Emails: ${JSON.stringify(osContext?.emails || [])}
- Active Tasks: ${JSON.stringify(osContext?.tasks || [])}
- Social Updates: ${JSON.stringify(osContext?.socials || [])}

GUIDELINES:
1. Keep spoken responses brief, human, and direct (1-3 sentences max unless asked for details).
2. Never sound robotic or output markdown code blocks.
3. If an ambient event triggered this (e.g., user playing music, new email arrived), bring it up naturally as an interjection.
`;

  try {
    // Call Gemini API / OpenRouter / AI Provider
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ text: "AI service key is missing. Please set GEMINI_API_KEY." });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt || ambientTrigger}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here, sir. How can I assist you?";

    return res.json({ text: replyText });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.json({ text: "I encountered a minor processing delay, sir. What was that again?" });
  }
});

export default router;