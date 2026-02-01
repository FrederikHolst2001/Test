// ================= BOOT SAFETY =================
process.on("unhandledRejection", err => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", err => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import Parser from "rss-parser";
import cron from "node-cron";
import yahooFinance from "yahoo-finance2";

const app = express();
const PORT = process.env.PORT || 3000;
const rss = new Parser();

app.use(express.json());

// ================= START SERVER FIRST =================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ================= NEWS =================
const NEWS_SOURCES = [
  { name: "FXStreet", url: "https://www.fxstreet.com/rss/news" },
  { name: "Investing", url: "https://www.investing.com/rss/news_1.rss" },
  { name: "ForexLive", url: "https://rss.forexlive.com/" },
  { name: "BabyPips", url: "https://babypips.com/feed.rss" }
];

async function fetchExternalNews(limit = 15) {
  const all = [];

  for (const src of NEWS_SOURCES) {
    try {
      const feed = await rss.parseURL(src.url);
      feed.items.slice(0, 8).forEach(item => {
        all.push({
          source: src.name,
          title: item.title?.trim(),
          link: item.link,
          date: new Date(item.pubDate || Date.now())
        });
      });
    } catch (err) {
      console.error(`RSS error (${src.name}):`, err.message);
    }
  }

  const seen = new Set();
  return all
    .filter(n => {
      const k = (n.title + n.link).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
}

app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchExternalNews();
    res.json(news);
  } catch (err) {
    console.error("NEWS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ================= FOREX FACTORY EVENTS =================
const FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
let ffCache = { data: [], ts: 0 };

async function getForexFactory() {
  if (Date.now() - ffCache.ts < 5 * 60 * 1000) return ffCache.data;

  try {
    const r = await fetch(FF_URL, {
      headers: { "User-Agent": "Mozilla/5.0 ForexBot" }
    });
    const j = await r.json();
    ffCache = { data: j, ts: Date.now() };
    return j;
  } catch (err) {
    console.error("FF ERROR:", err.message);
    return [];
  }
}

app.get("/api/events", async (req, res) => {
  try {
    const offset = Number(req.query.day || 0);
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + offset);
    const dstr = target.toISOString().split("T")[0];

    const data = await getForexFactory();
    const out = data.filter(e => {
      let d;
      if (e.timestamp) {
        d = new Date(e.timestamp * 1000).toISOString().split("T")[0];
      } else if (e.date) {
        d = new Date(e.date).toISOString().split("T")[0];
      }
      return (
        d === dstr &&
        ["high", "medium"].includes((e.impact || "").toLowerCase())
      );
    });

    res.json(out);
  } catch (err) {
    console.error("EVENT ERROR:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ================= FORECAST =================
function sma(values, length) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= length) sum -= values[i - length];
    if (i >= length - 1) out.push(sum / length);
  }
  return out;
}

app.get("/api/forecast", async (req, res) => {
  try {
    const symbols = [
      { key: "EURUSD", y: "EURUSD=X" },
      { key: "GBPUSD", y: "GBPUSD=X" },
      { key: "BTCUSD", y: "BTC-USD" }
    ];

    const result = [];

    for (const s of symbols) {
      const h = await yahooFinance.historical(s.y, {
        period1: "30d",
        interval: "1h"
      });

      const closes = h.map(c => c.close).filter(Boolean);
      if (closes.length < 55) continue;

      const s20 = sma(closes, 20).at(-1);
      const s50 = sma(closes, 50).at(-1);
      const last = closes.at(-1);

      result.push({
        symbol: s.key,
        bias: s20 > s50 ? "Bullish" : s20 < s50 ? "Bearish" : "Neutral",
        last
      });
    }

    res.json(result);
  } catch (err) {
    console.error("FORECAST ERROR:", err);
    res.status(500).json({ error: "Forecast failed" });
  }
});

// ================= REALTIME (SSE) =================
let clients = [];

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// ================= CRON (SAFE) =================
cron.schedule("*/5 * * * *", async () => {
  try {
    if (!clients.length) return;
    const news = await fetchExternalNews(5);
    clients.forEach(c =>
      c.write(`data: ${JSON.stringify(news)}\n\n`)
    );
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
});
