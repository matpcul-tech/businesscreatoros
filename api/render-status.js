// api/render-status.js
// Server-side proxy that checks the status of a JSON2Video render job.
// The JSON2Video key stays on the server.

const J2V_ENDPOINT = "https://api.json2video.com/v2/movies";

export default async function handler(req, res) {
  const apiKey = process.env.JSON2VIDEO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "JSON2VIDEO_API_KEY is not set on the server." });
  }

  const project = (req.query && req.query.project) || (req.body && req.body.project);
  if (!project) {
    return res.status(400).json({ error: "Provide a project id." });
  }

  try {
    const url = J2V_ENDPOINT + "?project=" + encodeURIComponent(project);
    const r = await fetch(url, { headers: { "x-api-key": apiKey } });
    const data = await r.json();

    console.log("JSON2Video status response:", JSON.stringify(data));

    const movie = (data && data.movie) || {};

    // Resolve status: prefer movie.status, fall back to top-level success flag.
    let status = movie.status || "unknown";
    if (status === "unknown" && data && data.success === false) status = "error";

    // Resolve message from movie or top level.
    const message = movie.message || (data && data.message) || null;

    return res.status(200).json({
      status,
      url: movie.url || null,
      message,
    });
  } catch (err) {
    return res.status(500).json({ error: "Status check failed.", detail: String(err) });
  }
}
