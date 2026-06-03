import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY is not set on the server." } });
  }
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: `Upstream error: ${err.message}` } });
  }
});

// Serve built frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../dist")));
  app.get("*", (_, res) => res.sendFile(join(__dirname, "../dist/index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server on :${PORT}`));
