import { Router } from "express";

const router = Router();

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
];

router.post("/chat", async (req, res) => {
  const { prompt, osContext, ambientTrigger } = req.body;

  const systemInstructionText = `
You are Nutty, an autonomous, highly intelligent personal operating system assistant (like JARVIS). You speak naturally, concisely, and conversationally out loud via text-to-speech.

CURRENT OS CONTEXT:
- Calendar Events: ${JSON.stringify(osContext?.calendar || [])}
- Unread Emails: ${JSON.stringify(osContext?.emails || [])}
- Active Tasks: ${JSON.stringify(osContext?.tasks || [])}
- Social Updates: ${JSON.stringify(osContext?.socials || [])}

STRICT CRITICAL RULES:
1. Output ONLY the raw spoken reply text intended for text-to-speech.
2. NEVER output your inner thoughts, reasoning steps, prompt summaries, bullet points, asterisks, or markdown.
3. Keep spoken responses brief, direct, and human (1 to 2 sentences max).
4. Address the user naturally or as "sir".
`;

  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.json({ text: "My GEMINI_API_KEY is missing in Render environment variables, sir." });
    }

    const apiKey = rawApiKey.trim();
    let candidateModels: string[] = [];

    // Dynamically discover supported models
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
        }
      }
    } catch (e) {
      console.warn("[Gemini ListModels] Failed to fetch dynamic list:", e);
    }

    if (candidateModels.length === 0) {
      candidateModels = FALLBACK_MODELS;
    }

    let rawReplyText = "";
    let lastError = "";

    // Execute generation with dedicated system_instruction payload
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
              system_instruction: {
                parts: [{ text: systemInstructionText }]
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt || ambientTrigger || "Hello" }]
                }
              ]
            }),
          }
        );

        const data: any = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          rawReplyText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastError = data?.error?.message || `HTTP ${response.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || "Network request failed";
      }
    }

    if (!rawReplyText) {
      return res.json({ text: `Neural network error: ${lastError}` });
    }

    // Clean any accidental markdown or reasoning bullets from the final response
    let cleanReply = rawReplyText
      .replace(/\*[\s\S]*?\*/g, '')      // Strip asterisks/italicized thoughts
      .replace(/^\s*\*.*$/gm, '')        // Strip bullet lines starting with *
      .replace(/^"|"$/g, '')             // Strip surrounding quotes
      .trim();

    if (!cleanReply) {
      const lines = rawReplyText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('*'));
      cleanReply = lines[lines.length - 1] || "All clear on my end, sir.";
    }

    return res.json({ text: cleanReply });
  } catch (error: any) {
    console.error("[AI Catch Error]:", error);
    return res.json({ text: `Processing delay: ${error?.message || "Unknown error"}` });
  }
});

export default router;