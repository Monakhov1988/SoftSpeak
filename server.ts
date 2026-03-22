import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/bot/db.js";
import bot from "./src/bot/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API diagnostic routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/bot-status", (req, res) => {
    res.json({
      initialized: !!process.env.TELEGRAM_BOT_TOKEN,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      hasAppUrl: !!process.env.APP_URL,
      appUrl: process.env.APP_URL ? "SET" : "MISSING"
    });
  });

  // Initialize Database and Bot only if Telegram token is provided
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      await initDb();
      console.log('Database initialized (SQLite)');

      const secretPath = `/telegraf/${process.env.TELEGRAM_BOT_TOKEN}`;
      if (process.env.NODE_ENV === "production" && process.env.APP_URL && !process.env.FORCE_POLLING) {
        await bot.telegram.setWebhook(`${process.env.APP_URL}${secretPath}`);
        app.use(bot.webhookCallback(secretPath));
        console.log('Bot webhook set at:', `${process.env.APP_URL}${secretPath}`);
      } else {
        // Clear webhook before launching polling to avoid conflicts
        await bot.telegram.deleteWebhook();
        bot.launch();
        console.log('Bot launched in polling mode');
      }
    } catch (err) {
      console.error('Failed to initialize Bot or DB:', err);
    }
  } else {
    console.warn('MISSING SECRETS: Bot is not initialized. Please add TELEGRAM_BOT_TOKEN to Secrets.');
  }

  if (process.env.NODE_ENV !== "production") {
    // В режиме разработки используем Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // В режиме продакшена отдаем статику из папки dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

startServer();
