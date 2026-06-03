export default async function handler(req, res) {
  res.json({
    ok: true,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    luma: !!process.env.LUMA_API_KEY,
  });
}
