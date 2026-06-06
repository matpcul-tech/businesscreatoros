// api/pexels-clips.js
// Server-side proxy for the Pexels Videos API.
// Takes a list of visual search terms and returns one stock clip URL per term.
// The Pexels key stays on the server. It is never exposed to the browser.

const PEXELS_ENDPOINT = "https://api.pexels.com/videos/search";

// Pick the best mp4 file from a Pexels video: prefer HD, cap resolution so
// renders stay cheap, and skip anything that is not a direct mp4 link.
function pickBestFile(videoFiles, maxWidth) {
  const mp4s = (videoFiles || []).filter(function (f) {
    return f.file_type === "video/mp4" && f.link;
  });
  if (mp4s.length === 0) return null;

  mp4s.sort(function (a, b) {
    return (a.width || 0) - (b.width || 0);
  });
  let chosen = null;
  for (const f of mp4s) {
    if ((f.width || 0) <= maxWidth) chosen = f;
  }
  return chosen || mp4s[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "PEXELS_API_KEY is not set on the server." });
  }

  const body = req.body || {};
  const terms = Array.isArray(body.terms) ? body.terms : [];
  const orientation = body.orientation === "portrait" ? "portrait" : "landscape";
  const maxWidth = orientation === "portrait" ? 1080 : 1920;

  if (terms.length === 0) {
    return res.status(400).json({ error: "Provide a non-empty terms array." });
  }

  try {
    const clips = [];

    for (const term of terms) {
      const url =
        PEXELS_ENDPOINT +
        "?query=" + encodeURIComponent(term) +
        "&orientation=" + orientation +
        "&size=medium" +
        "&per_page=5";

      const r = await fetch(url, { headers: { Authorization: apiKey } });
      if (!r.ok) continue;

      const data = await r.json();
      const videos = (data && data.videos) || [];

      let added = false;
      for (const v of videos) {
        const file = pickBestFile(v.video_files, maxWidth);
        if (file) {
          clips.push({
            term: term,
            url: file.link,
            width: file.width,
            height: file.height,
            duration: v.duration || null,
            pexels_id: v.id,
          });
          added = true;
          break;
        }
      }
      if (!added) clips.push({ term: term, url: null });
    }

    const usable = clips.filter(function (c) {
      return c.url;
    });

    return res.status(200).json({
      requested: terms.length,
      found: usable.length,
      clips: clips,
    });
  } catch (err) {
    return res.status(500).json({ error: "Pexels request failed.", detail: String(err) });
  }
}
