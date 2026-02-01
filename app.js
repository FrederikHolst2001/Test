const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

let dashboardInterval = null;

/* ---------- FORMATTER ---------- */
function formatPrice(symbol, value) {
  if (!value) return "—";

  if (symbol.includes("JPY")) return value.toFixed(3);

  if (
    symbol.includes("BTC") ||
    symbol.includes("ETH") ||
    symbol.includes("XAU")
  ) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return value.toFixed(5);
}

/* ---------- DATA FETCH ---------- */
async function fetchRates() {
  const [fx, crypto, metals] = await Promise.all([
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd").then(r => r.json()),
    fetch("https://metals-api.com/api/latest?base=USD&symbols=XAU")
      .then(r => r.json())
      .catch(() => null)
  ]);

  const xauUsd =
    metals && metals.rates && metals.rates.XAU
      ? 1 / metals.rates.XAU
      : null;

  return {
    EURUSD: fx.rates.EUR,
    GBPUSD: fx.rates.GBP,
    USDJPY: fx.rates.JPY,
    USDCHF: fx.rates.CHF,
    AUDUSD: fx.rates.AUD,
    USDCAD: fx.rates.CAD,
    XAUUSD: xauUsd,
    BTCUSD: crypto.bitcoin.usd,
    ETHUSD: crypto.ethereum.usd
  };
}

/* ---------- DASHBOARD ---------- */
async function loadDashboard() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  await updateDashboard();
  dashboardInterval = setInterval(updateDashboard, 30000);
}

async function updateDashboard() {
  const r = await fetchRates();

  const assets = [
    ["EUR/USD", r.EURUSD],
    ["GBP/USD", r.GBPUSD],
    ["USD/JPY", r.USDJPY],
    ["USD/CHF", r.USDCHF],
    ["AUD/USD", r.AUDUSD],
    ["USD/CAD", r.USDCAD],
    ["XAU/USD", r.XAUUSD],
    ["BTC/USD", r.BTCUSD],
    ["ETH/USD", r.ETHUSD]
  ];

  ticker.innerHTML =
    assets.map(a =>
      `<span>${a[0]} <strong>${formatPrice(a[0], a[1])}</strong></span>`
    ).join(" • ") +
    " • " +
    assets.map(a =>
      `<span>${a[0]} <strong>${formatPrice(a[0], a[1])}</strong></span>`
    ).join(" • ");

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex <span>Trading Intelligence</span></h1>
      <p>Real-time prices, market analysis, economic calendar and AI-style insights.</p>
    </section>

    <section class="grid">
      ${assets.map(a => `
        <div class="card">
          <h3>${a[0]}</h3>
          <div class="price">${formatPrice(a[0], a[1])}</div>
        </div>
      `).join("")}
    </section>

    <section class="card" style="margin-top:40px;">
      <h3>🧠 Market Summary</h3>
      <p>The US Dollar remains firm across majors while gold and crypto show elevated volatility.</p>
    </section>
  `;
}

/* ---------- OTHER PAGES ---------- */
function loadAnalysis() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>Market <span>Analysis</span></h1>
      <p>Technical bias, macro outlook and cross-asset insights.</p>
    </section>
  `;
}

async function loadNews() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>Market <span>News</span></h1>
      <p>No news available right now.</p>
    </section>
  `;
}

function loadPlaceholder(title, text) {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>${title}</h1>
      <p>${text}</p>
    </section>
  `;
}

/* ---------- ROUTER ---------- */
function handleRoute() {
  const h = window.location.hash;
  if (h === "#analysis") loadAnalysis();
  else if (h === "#news") loadNews();
  else if (h === "#calendar-today") loadPlaceholder("Economic Calendar","Upcoming high-impact events.");
  else if (h === "#signals") loadPlaceholder("Trading Signals","Educational market bias and setups.");
  else loadDashboard();
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
