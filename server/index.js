import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

async function start() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      luma: !!process.env.LUMA_API_KEY,
    });
  });

  app.post("/api/generate", async (req, res) => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY is not set in .env" } });
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

  app.post("/api/luma/generate", async (req, res) => {
    const key = process.env.LUMA_API_KEY;
    if (!key) {
      return res.status(500).json({ detail: "LUMA_API_KEY is not set in .env" });
    }
    try {
      const upstream = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ detail: `Upstream error: ${err.message}` });
    }
  });

  app.get("/api/luma/poll/:id", async (req, res) => {
    const key = process.env.LUMA_API_KEY;
    if (!key) {
      return res.status(500).json({ detail: "LUMA_API_KEY is not set in .env" });
    }
    try {
      const upstream = await fetch(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${req.params.id}`,
        { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
      );
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ detail: `Upstream error: ${err.message}` });
    }
  });

  if (isProd) {
    app.use(express.static(join(__dirname, "../dist")));
    app.get("*", (_, res) => res.sendFile(join(__dirname, "../dist/index.html")));
  } else {
    // Vite runs as Express middleware — single port, HMR still works
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server: http://localhost:${PORT}`));
}

start();
