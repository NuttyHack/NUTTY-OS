import { Router } from "express";

const router = Router();

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
];

// Helper to strip out internal AI thoughts, draft notes, and metadata
function extractSpokenText(rawText: string): string {
  if (!rawText) return "I'm online, sir.";

  // 1. If Gemini placed the final answer inside double quotes, extract that last quote
  const quoteMatches = Array.from(rawText.matchAll(/"([^"]{3,})"/g));
  if (quoteMatches.length > 0) {
    const lastQuote = quoteMatches[quoteMatches.length - 1][1].trim();
    if (!lastQuote.includes("SpeakingIntent") && !lastQuote.includes("Constraint:")) {
      return lastQuote;
    }
  }

  // 2. Remove internal scratchpad keywords and evaluation lines
  let cleaned = rawText
    .replace(/^(SpeakingIntent|Intent|Name|Constraint|Draft\s*\d*|Note|Reasoning|Evaluation|Check|Context):.*$/gmi, '')
    .replace(/^.*\?\s*(Yes|No)\.?$/gmi, '')
    .replace(/\*[\s\S]*?\*/g, '')
    .replace(/^\s*[\*\-\•].*$/gm, '')
    .trim();

  // 3. Select the final clean line
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    cleaned = lines[lines.length - 1];
  }

  return cleaned.replace(/^["']|["']$/g, '').trim() || "All clear on my end, sir.";
}

router.post("/chat", async (req, res) => {
  const { prompt, osContext, ambientTrigger } = req.body;

  const systemInstructionText = `
You are Nutty, an autonomous personal operating system assistant (like JARVIS). You speak naturally out loud.

CURRENT OS CONTEXT:
- Calendar: ${JSON.stringify(osContext?.calendar || [])}
- Emails: ${JSON.stringify(osContext?.emails || [])}
- Tasks: ${JSON.stringify(osContext?.tasks || [])}
- Socials: ${JSON.stringify(osContext?.socials || [])}

INSTRUCTIONS:
Speak directly to the user in 1-2 brief sentences. Do NOT output internal notes, planning steps, or drafts.
`;

  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.json({ text: "My GEMINI_API_KEY is missing in Render environment variables, sir." });
    }

    const apiKey = rawApiKey.trim();
    let candidateModels: string[] = [];

    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (listRes.ok) {
        const listData: any = await listRes.json();
        const available = (listData?.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""));

        if (available.length > 0) candidateModels = available;
      }
    } catch (e) {
      console.warn("[Gemini ListModels] Failed to fetch list:", e);
    }

    if (candidateModels.length === 0) candidateModels = FALLBACK_MODELS;

    let rawReplyText = "";
    let lastError = "";

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstructionText }]
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt || ambientTrigger || "Hello" }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100
              }
            }),
          }
        );

        const data: any = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts) {
          const parts = data.candidates[0].content.parts;
          // Filter out parts marked as thought blocks
          const nonThoughtParts = parts.filter((p: any) => !p.thought);
          
          rawReplyText = (nonThoughtParts.length > 0 ? nonThoughtParts : parts)
            .map((p: any) => p.text || "")
            .join("\n");

          if (rawReplyText.trim()) break;
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

    // Extract ONLY the clean spoken sentence
    const cleanReply = extractSpokenText(rawReplyText);

    return res.json({ text: cleanReply });
  } catch (error: any) {
    console.error("[AI Catch Error]:", error);
    return res.json({ text: `Processing delay: ${error?.message || "Unknown error"}` });
  }
});

export default router;