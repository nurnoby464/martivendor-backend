import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";
import type { Request, Response } from "express";

let isConnected = false;

const ensureDBConnection = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

// Vercel sets VERCEL=1 and uses the exported handler.
// Everywhere else (local, Render) we run a normal server.
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 5000;

  ensureDBConnection()
    .then(() => {
      app.listen(PORT, () => {
       console.log(`[Server] Running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("[Server] Startup failed:", err);
      process.exit(1);
    });
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDBConnection();
    return app(req, res);
  } catch (err) {
    console.error("[Handler] Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
