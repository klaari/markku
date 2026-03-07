import { Hono } from "hono";

export const healthRoute = new Hono();

healthRoute.get("/health", async (c) => {
  let ytdlpOk = false;
  try {
    const proc = Bun.spawn(["yt-dlp", "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const code = await proc.exited;
    ytdlpOk = code === 0;
  } catch {
    // yt-dlp not found
  }

  return c.json({
    status: "ok",
    ytdlp: ytdlpOk,
  });
});
