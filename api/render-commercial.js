// api/render-commercial.js
// Server-side proxy that builds a JSON2Video movie payload and submits it.
// Returns a project id. The frontend then polls /api/render-status with that id.
// The JSON2Video key stays on the server.

const J2V_ENDPOINT = "https://api.json2video.com/v2/movies";

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
  const sceneDuration = Number(body.sceneDuration) || 5;

  if (!script) {
    return res.status(400).json({ error: "Provide a script string." });
  }
  if (clips.length === 0) {
    return res.status(400).json({ error: "Provide at least one clip URL." });
  }

  const scenes = clips.map(function (clipUrl) {
    return {
      elements: [
        {
          type: "video",
          src: clipUrl,
          duration: sceneDuration,
        },
      ],
    };
  });

  const movie = {
    quality: "high",
    scenes: scenes,
    elements: [
      {
        type: "voice",
        text: script,
        voice: "en-US-Wavenet-D",
      },
    ],
  };

  if (orientation === "portrait") {
    movie.width = 1080;
    movie.height = 1920;
  } else {
    movie.resolution = "full-hd";
  }

  console.log("Submitting to JSON2Video:", JSON.stringify(movie));

  try {
    const r = await fetch(J2V_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movie),
    });

    const data = await r.json();
    console.log("JSON2Video submit response:", JSON.stringify(data));

    if (!r.ok || data.success === false) {
      return res.status(502).json({
        error: "JSON2Video rejected the render.",
        detail: data && (data.message || data.error || JSON.stringify(data)),
      });
    }

    return res.status(200).json({
      project: data.project,
      sceneCount: scenes.length,
      estimatedSeconds: scenes.length * sceneDuration,
    });
  } catch (err) {
    console.error("JSON2Video fetch failed:", err);
    return res.status(500).json({ error: "JSON2Video request failed.", detail: String(err) });
  }
}
