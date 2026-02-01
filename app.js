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
    ratesBox.innerHTML = "Rates unavailable";
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

// ================= CHARTS PAGE =================
function loadCharts() {
  content.innerHTML = `
    <div class="chart-box">
      <div id="tv1"></div>
    </div>
    <div class="chart-box">
      <div id="tv2"></div>
    </div>
    <div class="chart-box">
      <div id="tv3"></div>
    </div>
  `;

  loadTradingView("tv1", "OANDA:EURUSD");
  loadTradingView("tv2", "OANDA:XAUUSD");
  loadTradingView("tv3", "BITSTAMP:BTCUSD");
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
      style: "1",
      locale: "en"
    });
  };
  document.body.appendChild(script);
}

// ================= ROUTER =================
function handleRoute() {
  const h = window.location.hash;

  if (h === "#charts") loadCharts();
  else if (h === "#signals") loadSignals();
  else if (h === "#calendar-today") loadEvents(0);
  else loadNews();
}

// ================= INIT =================
window.addEventListener("load", () => {
  handleRoute();
  loadRates();
});

window.addEventListener("hashchange", handleRoute);
