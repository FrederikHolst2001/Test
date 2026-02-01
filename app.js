console.log("✅ app.js loaded");

const API_BASE = "";
const content = document.getElementById("content");
const ratesBox = document.getElementById("rates");
const searchInput = document.getElementById("searchInput");

let allNews = [];
let currentCategory = "ALL";

// ================= FX RATES =================
async function loadRates() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();

    const pairs = [
      ["EUR/USD", data.rates.EUR],
      ["GBP/USD", data.rates.GBP],
      ["USD/JPY", data.rates.JPY],
      ["AUD/USD", data.rates.AUD],
      ["USD/CAD", data.rates.CAD]
    ];

    ratesBox.innerHTML = pairs.map(p => `
      <div class="rate">
        <span>${p[0]}</span>
        <strong>${p[1].toFixed(4)}</strong>
      </div>
    `).join("");
  } catch {
    ratesBox.innerHTML = "<p>Rates unavailable</p>";
  }
}

// ================= FILTERING =================
function setCategory(cat) {
  currentCategory = cat;
  applyFilters();
}

function applyFilters() {
  const q = searchInput.value.toLowerCase();

  const filtered = allNews.filter(n => {
    const t = n.title.toLowerCase();
    if (q && !t.includes(q)) return false;

    if (currentCategory === "USD") return t.includes("usd");
    if (currentCategory === "EUR") return t.includes("eur");
    if (currentCategory === "GOLD") return t.includes("gold") || t.includes("xau");
    if (currentCategory === "CRYPTO") return t.includes("btc") || t.includes("crypto");

    return true;
  });

  renderNews(filtered);
}

// ================= NEWS =================
function renderNews(news) {
  if (!news.length) {
    content.innerHTML = "<p>No matching news.</p>";
    return;
  }

  const [featured, ...rest] = news;

  content.innerHTML = `
    <section class="hero">
      <h2>${featured.title}</h2>
      <p>
        <strong>${featured.source}</strong><br>
        <a href="${featured.link}" target="_blank">Read full story →</a>
      </p>
    </section>
  ` + rest.map(n => `
    <article class="card">
      <h3>${n.title}</h3>
      <p>
        <strong>${n.source}</strong><br>
        <a href="${n.link}" target="_blank">Read article →</a>
      </p>
    </article>
  `).join("");
}

async function loadNews() {
  const res = await fetch(`${API_BASE}/api/news`);
  allNews = await res.json();
  applyFilters();
}

// ================= CALENDAR =================
async function loadEvents(offset) {
  content.innerHTML = "<p>Loading economic calendar…</p>";

  try {
    const res = await fetch(`${API_BASE}/api/events?day=${offset}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      content.innerHTML = `
        <div class="card">
          <h3>No economic events</h3>
          <p>
            There are no high or medium impact events
            ${offset === 0 ? "today" : "tomorrow"}.
          </p>
        </div>
      `;
      return;
    }

    content.innerHTML = data.map(e => `
      <article class="card">
        <h3>${e.title}</h3>
        <p>
          Impact: <strong>${e.impact}</strong><br>
          Actual: ${e.actual || "N/A"} |
          Forecast: ${e.forecast || "N/A"} |
          Previous: ${e.previous || "N/A"}
        </p>
      </article>
    `).join("");

  } catch {
    content.innerHTML = "<p>Failed to load calendar.</p>";
  }
}

// ================= SIGNALS =================
async function loadSignals() {
  content.innerHTML = "<p>Loading market signals…</p>";

  try {
    const res = await fetch(`${API_BASE}/api/signals`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      content.innerHTML = `
        <div class="card">
          <h3>No signals available</h3>
          <p>
            There are currently no market signals.
            Please check back later.
          </p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <p style="color:#b45309;">
        ⚠️ Educational analysis only. Not financial advice.
      </p>
    ` + data.map(s => `
      <article class="card">
        <h3>${s.symbol} (${s.timeframe})</h3>
        <p>
          Bias: <strong>${s.bias}</strong><br>
          Expected Move: <strong>${s.expectedMove}</strong><br>
          Entry Zone: ${s.entryZone[0]} – ${s.entryZone[1]}<br>
          Target: ${s.target || "—"}<br>
          Invalidation: ${s.invalidation || "—"}
        </p>
      </article>
    `).join("");

  } catch {
    content.innerHTML = "<p>Failed to load signals.</p>";
  }
}

// ================= ROUTER =================
function handleRoute() {
  const h = window.location.hash;

  if (h === "#calendar-today") loadEvents(0);
  else if (h === "#calendar-tomorrow") loadEvents(1);
  else if (h === "#signals") loadSignals();
  else if (h === "#charts") loadCharts();
  else loadNews();
}

// ================= CHARTS =================
function loadCharts() {
  content.innerHTML = `
    <div class="chart-box"><div id="tv1"></div></div>
    <div class="chart-box"><div id="tv2"></div></div>
  `;

  loadTradingView("tv1", "OANDA:EURUSD");
  loadTradingView("tv2", "BITSTAMP:BTCUSD");
}

function loadTradingView(container, symbol) {
  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/tv.js";
  script.onload = () => {
    new TradingView.widget({
      container_id: container,
      symbol,
      interval: "60",
      theme: "light",
      locale: "en"
    });
  };
  document.body.appendChild(script);
}

// ================= INIT =================
window.addEventListener("load", () => {
  handleRoute();
  loadRates();
});

window.addEventListener("hashchange", handleRoute);
