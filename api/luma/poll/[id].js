export default async function handler(req, res) {
  const key = process.env.LUMA_API_KEY;
  if (!key) {
    return res.status(500).json({ detail: "LUMA_API_KEY not set in Vercel environment variables" });
  }

  try {
    const upstream = await fetch(
      `https://api.lumalabs.ai/dream-machine/v1/generations/${req.query.id}`,
      { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ detail: err.message });
  }
}
