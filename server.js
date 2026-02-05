import "dotenv/config";
import express from "express";
import Parser from "rss-parser";
import yahooFinance from "yahoo-finance2";

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const app = express();
const PORT = process.env.PORT || 3000;
const rss = new Parser();

app.use(express.json());

// ---------- START ----------
app.listen(PORT, () => {
  console.log("✅ Backend running on port", PORT);
});

// ---------- HEALTH ----------
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---------- NEWS ----------
const NEWS_SOURCES = [
  { name: "FXStreet", url: "https://www.fxstreet.com/rss/news" },
  { name: "Investing", url: "https://www.investing.com/rss/news_1.rss" },
  { name: "ForexLive", url: "https://rss.forexlive.com/" },
  { name: "BabyPips", url: "https://babypips.com/feed.rss" }
];

async function fetchExternalNews(limit = 15) {
  let all = [];
  for (const src of NEWS_SOURCES) {
    try {
      const feed = await rss.parseURL(src.url);
      feed.items.slice(0, 6).forEach(i => {
        all.push({
          source: src.name,
          title: i.title,
          link: i.link,
          date: new Date(i.pubDate || Date.now())
        });
      });
    } catch {}
  }
  return all
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
}

app.get("/api/news", async (req, res) => {
  res.json(await fetchExternalNews());
});

app.get("/api/prices", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY"
    );

    const j = await r.json();

    const prices = [
      { symbol: "EUR/USD", price: +(1 / j.rates.EUR).toFixed(5) },
      { symbol: "GBP/USD", price: +(1 / j.rates.GBP).toFixed(5) },
      { symbol: "USD/JPY", price: +j.rates.JPY.toFixed(3) }
    ];

    res.json(prices);
  } catch (err) {
    console.error("Price fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

app.get("/api/prices2", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY"
    );

    if (!r.ok) {
      throw new Error("Frankfurter API error");
    }

    const data = await r.json();

    res.json([
      { symbol: "EUR/USD", price: data.rates.EUR },
      { symbol: "GBP/USD", price: data.rates.GBP },
      { symbol: "USD/JPY", price: data.rates.JPY }
    ]);
  } catch (err) {
    console.error("FX price error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

app.get("/api/analysis", (req, res) => {
  res.json([
    {
      title: "EUR/USD Outlook",
      text: "EUR/USD remains bullish above the 1.08 support level."
    },
    {
      title: "USD Momentum",
      text: "USD strength may slow ahead of CPI data this week."
    }
  ]);
});



// ---------- EVENTS ----------
const FF_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

app.get("/api/calender", async (req, res) => {
  const offset = Number(req.query.day || 0);
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + offset);
  const d = target.toISOString().split("T")[0];

  try {
    const r = await fetch(FF_URL);
    const j = await r.json();
    res.json(j.filter(e => {
      const ed = e.timestamp
        ? new Date(e.timestamp * 1000).toISOString().split("T")[0]
        : null;
      return ed === d && ["high", "medium"].includes((e.impact || "").toLowerCase());
    }));
  } catch {
    res.json([]);
  }
});

// ---------- FORECAST ----------
app.get("/api/forecast", async (req, res) => {
  const symbols = [
    { key: "EURUSD", y: "EURUSD=X" },
    { key: "GBPUSD", y: "GBPUSD=X" },
    { key: "BTCUSD", y: "BTC-USD" }
  ];

  const out = [];
  for (const s of symbols) {
    try {
      const h = await yahooFinance.historical(s.y, { period1: "30d", interval: "1h" });
      const closes = h.map(c => c.close).filter(Boolean);
      out.push({
        symbol: s.key,
        bias: "Neutral",
        last: closes.at(-1)
      });
    } catch {
      out.push({ symbol: s.key, bias: "Unavailable", last: null });
    }
  }
  res.json(out);
});

// ---------- SIGNALS ----------
app.get("/api/signals", async (req, res) => {
  const symbols = [
    { key: "EURUSD", y: "EURUSD=X" },
    { key: "GBPUSD", y: "GBPUSD=X" },
    { key: "BTCUSD", y: "BTC-USD" }
  ];

  const signals = [];

  for (const s of symbols) {
    try {
      const h = await yahooFinance.historical(s.y, { period1: "14d", interval: "1h" });
      const closes = h.map(c => c.close).filter(Boolean);
      const last = closes.at(-1);
      const prev = closes.at(-6);
      const dir = last > prev ? "Up" : last < prev ? "Down" : "Range";

      signals.push({
        symbol: s.key,
        timeframe: "1H",
        bias: dir === "Up" ? "Bullish" : dir === "Down" ? "Bearish" : "Neutral",
        expectedMove: dir,
        entryZone: [(last * 0.998).toFixed(4), (last * 1.002).toFixed(4)],
        target: dir === "Up" ? (last * 1.006).toFixed(4) : dir === "Down" ? (last * 0.994).toFixed(4) : null,
        invalidation: dir === "Up" ? (last * 0.994).toFixed(4) : (last * 1.006).toFixed(4),
        confidence: "Medium"
      });
    } catch {}
  }

  res.json(signals);
});














