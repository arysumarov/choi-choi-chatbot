// Choi Choi 菜菜 – natural voice output (text-to-speech) via Azure AI Speech neural voices.
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. "eastasia") in the environment.
// Returns an MP3. If the key is missing, returns 501 and the page falls back to the browser's own voice.

const MAX_CHARS = 700;

// Voices can be changed here without touching the page.
const VOICE_YUE = process.env.TTS_VOICE_YUE || "zh-HK-HiuGaaiNeural"; // Cantonese, warm female voice
const VOICE_EN = process.env.TTS_VOICE_EN || "en-US-AnaNeural"; // English, child's voice – fits a little vegetable

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

const xmlEscape = (s) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST" });

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return send(res, 501, { error: "TTS not configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  let text = typeof body?.text === "string" ? body.text : "";
  text = text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "") // no emoji
    .replace(/[~～]/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
  if (!text) return send(res, 400, { error: "No text" });

  const yue = /[㐀-鿿]/.test(text);
  if (!yue) text = text.replace(/菜菜/g, "").replace(/\s{2,}/g, " "); // English voice can't read Chinese
  const voice = yue ? VOICE_YUE : VOICE_EN;
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${yue ? "zh-HK" : "en-US"}">` +
    `<voice name="${voice}"><prosody rate="${yue ? "+5%" : "0%"}">${xmlEscape(text)}</prosody></voice></speak>`;

  try {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "choi-choi-chatbot",
      },
      body: ssml,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.error("Azure TTS error", r.status, (await r.text()).slice(0, 300));
      return send(res, 502, { error: "TTS error" });
    }
    const audio = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.end(audio);
  } catch (err) {
    console.error("TTS request failed", err);
    return send(res, 504, { error: "Timeout" });
  }
};
