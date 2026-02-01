const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

let dashboardInterval = null;

/* ================= FORMAT ================= */
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

/* ================= FETCH REAL DATA ================= */
async function fetchRates() {
  const [fx, crypto, metals] = await Promise.all([
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd").then(r => r.json()),
    fetch("https://metals-api.com/api/latest?base=USD&symbols=XAU")
      .then(r => r.json())
      .catch(() => null)
  ]);

  // FX (correctly inverted where needed)
  const EURUSD = 1 / fx.rates.EUR;
  const GBPUSD = 1 / fx.rates.GBP;
  const AUDUSD = 1 / fx.rates.AUD;

  const USDJPY = fx.rates.JPY;
  const USDCHF = fx.rates.CHF;
  const USDCAD = fx.rates.CAD;

  // GOLD (XAU/USD)
  const XAUUSD =
    metals && metals.rates?.XAU
      ? 1 / metals.rates.XAU
      : null;

  return {
    EURUSD,
    GBPUSD,
    AUDUSD,
    USDJPY,
    USDCHF,
    USDCAD,
    XAUUSD,
    BTCUSD: crypto.bitcoin.usd,
    ETHUSD: crypto.ethereum.usd
  };
}

/* ================= DASHBOARD ================= */
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

  // Ticker (duplicated for infinite scroll)
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
      <h3>📊 Market Summary</h3>
      <p>
        USD strength remains dominant across FX markets while gold and crypto
        experience elevated volatility amid risk repricing.
      </p>
    </section>
  `;
}

/* ================= ROUTER ================= */
function loadPlaceholder(title, text) {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>${title}</h1>
      <p>${text}</p>
    </section>
  `;
}

function handleRoute() {
  const h = window.location.hash;
  if (h === "#analysis") loadPlaceholder("Market Analysis", "Technical and macro outlook.");
  else if (h === "#news") loadPlaceholder("Market News", "Live headlines coming soon.");
  else if (h === "#calendar-today") loadPlaceholder("Economic Calendar", "Upcoming events.");
  else if (h === "#signals") loadPlaceholder("Trading Signals", "Educational market bias.");
  else loadDashboard();
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
