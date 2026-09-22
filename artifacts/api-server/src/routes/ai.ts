import { Router } from "express";

const router = Router();

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
];

function extractSpokenText(rawText: string, userPrompt: string): string {
  if (!rawText) return "I'm online, sir.";

  const normalizedPrompt = (userPrompt || "").toLowerCase().trim();

  // Split into lines and clean whitespace
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Filter out thoughts, metadata, draft labels, and prompt echoes
  const cleanLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase().replace(/^["']|["']$/g, "").trim();

    // 1. Filter out exact or partial echoes of what the user said
    if (normalizedPrompt && (lowerLine === normalizedPrompt || lowerLine.includes(normalizedPrompt))) {
      return false;
    }

    // 2. Filter out internal thinking headers and scratchpad metadata
    if (
      /^(speakingintent|intent|name|constraint|draft|note|reasoning|evaluation|context|user input|user said|thought):/i.test(line)
    ) {
      return false;
    }

    // 3. Filter out self-check questions like "No markdown? Yes."
    if (/\?\s*(yes|no)\.?$/i.test(line)) {
      return false;
    }

    return true;
  });

  if (cleanLines.length === 0) {
    return "All quiet on your social feeds today, sir.";
  }

  // Pick the last valid conversational sentence
  let selected = cleanLines[cleanLines.length - 1];

  // Strip Markdown asterisks and quotes
  selected = selected
    .replace(/\*[\s\S]*?\*/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  return selected || "All quiet on your social feeds today, sir.";
}

router.post("/chat", async (req, res) => {
  const { prompt, osContext, ambientTrigger } = req.body;
  const userMessage = prompt || ambientTrigger || "Hello";

  const systemInstructionText = `
You are Nutty, an autonomous personal operating system assistant (like JARVIS).
You respond directly to the user out loud.

CURRENT OS CONTEXT:
- Calendar: ${JSON.stringify(osContext?.calendar || [])}
- Emails: ${JSON.stringify(osContext?.emails || [])}
- Tasks: ${JSON.stringify(osContext?.tasks || [])}
- Socials: ${JSON.stringify(osContext?.socials || [])}

RULES:
1. Reply directly to the user's request in 1 to 2 brief sentences.
2. NEVER echo or repeat the user's message.
3. NEVER output thought processes, reasoning notes, or draft labels.
`;

  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.json({ text: "My GEMINI_API_KEY is missing in Render environment variables, sir." });
    }

    const apiKey = rawApiKey.trim();
    let candidateModels: string[] = [];

    // Dynamically query supported models
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
                  parts: [{ text: userMessage }]
                }
              ],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 120
              }
            }),
          }
        );

        const data: any = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts) {
          const parts = data.candidates[0].content.parts;
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

    // Filter out user echoes and extract only Nutty's real reply
    const cleanReply = extractSpokenText(rawReplyText, userMessage);

    return res.json({ text: cleanReply });
  } catch (error: any) {
    console.error("[AI Catch Error]:", error);
    return res.json({ text: `Processing delay: ${error?.message || "Unknown error"}` });
  }
});

export default router;