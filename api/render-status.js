// api/render-status.js
// Server-side proxy that checks the status of a JSON2Video render job.
// Call this on an interval from the frontend until status is "done".
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
    const r = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    const data = await r.json();
    const movie = (data && data.movie) || {};

    // status values: "running", "done", "error"
    return res.status(200).json({
      status: movie.status || "unknown",
      url: movie.url || null,       // final mp4 once done
      subtitles: movie.ass || null, // generated subtitle file
      message: movie.message || null,
      remaining: data && data.remaining_quota ? data.remaining_quota.time : null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Status check failed.", detail: String(err) });
  }
}
