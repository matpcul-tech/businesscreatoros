// api/render-commercial.js
// Builds a JSON2Video movie and submits it. Returns a project id.
// The video length follows the narration so the full script is always heard.
// Adds Ken Burns motion, scene transitions, karaoke captions, optional music.
// The JSON2Video key stays on the server.

const J2V_ENDPOINT = "https://api.json2video.com/v2/movies";

// Rough speaking rate in words per second. Azure TTS runs ~130-140 wpm
// naturally. 2.0 wps (120 wpm) keeps the video longer than the audio.
const WORDS_PER_SECOND = 2.0;

// Confirmed transition styles. Cycle them for variety.
const TRANSITIONS = ["fade", "circleopen", "wipeup"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.JSON2VIDEO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "JSON2VIDEO_API_KEY is not set on the server." });
  }

  const body = req.body || {};
  const script = (body.script || "").trim();
  const clips = Array.isArray(body.clips) ? body.clips.filter(Boolean) : [];
  const orientation = body.orientation === "portrait" ? "portrait" : "landscape";

  // Voice selection. Azure voices are free. ElevenLabs voices cost credits.
  const voiceModel = body.voiceModel || "azure";
  const voiceName = body.voiceName || "en-US-AriaNeural";

  // Optional background music. A direct mp3 URL plays low under the voice.
  const musicUrl = body.musicUrl || null;

  if (!script) {
    return res.status(400).json({ error: "Provide a script string." });
  }
  if (clips.length === 0) {
    return res.status(400).json({ error: "Provide at least one clip URL." });
  }

  // Estimate narration length, then size the visuals to match so the whole
  // script is heard and the video never feels cut off.
  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const speechSeconds = Math.max(8, Math.ceil(wordCount / WORDS_PER_SECOND));

  // About 4 seconds of screen time per clip keeps the pacing energetic.
  // Add 2 buffer scenes so the video always outlasts the voice audio.
  const perClip = 4;
  const sceneCount = Math.max(clips.length, Math.ceil(speechSeconds / perClip) + 2);

  // Build scenes by cycling through the clips so the visuals fill the whole
  // narration even when there are more scenes than unique clips.
  const scenes = [];
  for (let i = 0; i < sceneCount; i++) {
    const clipUrl = clips[i % clips.length];
    const zoom = i % 2 === 0 ? 2 : -2; // alternate gentle zoom in and out

    const scene = {
      elements: [
        {
          type: "video",
          src: clipUrl,
          duration: perClip,
          resize: "cover",
          zoom: zoom,
          volume: 0, // mute the stock clip so only the voiceover is heard
        },
      ],
    };

    if (i > 0) {
      scene.transition = {
        style: TRANSITIONS[i % TRANSITIONS.length],
        duration: 0.6,
      };
    }

    scenes.push(scene);
  }

  // Movie level elements overlay every scene.
  const elements = [
    {
      type: "voice",
      text: script,
      model: voiceModel,
      voice: voiceName,
      "extra-time": 3, // pad so the last word is never clipped
    },
    {
      type: "subtitles",
      language: "auto",
      settings: {
        style: "classic",
        "font-family": "Oswald",
        "font-weight": "700",
        "font-size": orientation === "portrait" ? 72 : 56,
        "max-words-per-line": 4,
        "all-caps": true,
        "word-color": "#FFD166",
        "outline-color": "#000000",
        "outline-width": 6,
      },
    },
  ];

  if (musicUrl) {
    elements.push({ type: "audio", src: musicUrl, volume: 0.12 });
  }

  const movie = { quality: "high", scenes: scenes, elements: elements };

  if (orientation === "portrait") {
    movie.width = 1080;
    movie.height = 1920;
  } else {
    movie.resolution = "full-hd";
  }

  try {
    const r = await fetch(J2V_ENDPOINT, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(movie),
    });

    const data = await r.json();

    if (!r.ok || data.success === false) {
      return res.status(502).json({
        error: "JSON2Video rejected the render.",
        detail: data && (data.message || data.error || data),
      });
    }

    return res.status(200).json({
      project: data.project,
      sceneCount: scenes.length,
      estimatedSeconds: speechSeconds,
    });
  } catch (err) {
    return res.status(500).json({ error: "JSON2Video request failed.", detail: String(err) });
  }
}
