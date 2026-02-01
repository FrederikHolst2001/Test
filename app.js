const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

let dashboardInterval = null;

// ================= DATA =================
async function fetchRates() {
  const [fx, crypto] = await Promise.all([
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd").then(r => r.json())
  ]);

  return {
    EURUSD: fx.rates.EUR,
    GBPUSD: fx.rates.GBP,
    USDJPY: fx.rates.JPY,
    USDCHF: fx.rates.CHF,
    AUDUSD: fx.rates.AUD,
    USDCAD: fx.rates.CAD,
    XAUUSD: 2030, // fallback gold reference
    BTCUSD: crypto.bitcoin.usd,
    ETHUSD: crypto.ethereum.usd
  };
}

// ================= DASHBOARD =================
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

  const tickerHTML = assets
    .map(a => `<span>${a[0]} <strong>${a[1].toFixed(2)}</strong></span>`)
    .join(" • ");

  ticker.innerHTML = tickerHTML + " • " + tickerHTML;

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex <span>Trading Intelligence</span></h1>
      <p>Real-time prices, market analysis, economic calendar and AI-style insights.</p>
    </section>

    <section class="grid">
      ${assets.map(a => `
        <div class="card">
          <h3>${a[0]}</h3>
          <div class="price">${a[1].toLocaleString()}</div>
        </div>
      `).join("")}
    </section>

    <section class="card" style="margin-top:40px;">
      <h3>🤖 Market Summary</h3>
      <p>The US Dollar remains firm across majors while gold and crypto show elevated volatility.</p>
    </section>
  `;
}

// ================= ANALYSIS =================
function loadAnalysis() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  content.innerHTML = `
    <section class="hero">
      <h1>Market <span>Analysis</span></h1>
      <p>Technical bias, macro outlook and cross-asset insights.</p>
    </section>

    <section class="grid">
      <div class="card"><h3>USD Outlook</h3><p>USD remains supported by yields and data.</p></div>
      <div class="card"><h3>Gold</h3><p>Gold consolidates near key resistance.</p></div>
      <div class="card"><h3>Crypto</h3><p>BTC and ETH remain volatile amid ETF flows.</p></div>
    </section>
  `;
}

// ================= NEWS =================
async function loadNews() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  content.innerHTML = `
    <section class="hero">
      <h1>Market <span>News</span></h1>
      <p>Latest forex and macroeconomic headlines.</p>
    </section>
    <section id="news-list"></section>
  `;

  try {
    const res = await fetch("/api/news");
    const data = await res.json();

    const list = document.getElementById("news-list");

    if (!data.length) {
      list.innerHTML = `<div class="card">No news available.</div>`;
      return;
    }

    list.innerHTML = `
      <section class="grid">
        ${data.map(n => `
          <article class="card">
            <h3>${n.title}</h3>
            <p style="color:#9ca3af">${n.source}</p>
            <a href="${n.link}" target="_blank" style="color:#60a5fa">
              Read full article →
            </a>
          </article>
        `).join("")}
      </section>
    `;
  } catch {
    content.innerHTML += `<div class="card">Failed to load news.</div>`;
  }
}

// ================= PLACEHOLDER =================
function loadPlaceholder(title, text) {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>${title}</h1>
      <p>${text}</p>
    </section>
  `;
}

// ================= ROUTER =================
function handleRoute() {
  const h = window.location.hash;

  if (h === "#analysis") loadAnalysis();
  else if (h === "#news") loadNews();
  else if (h === "#calendar-today") loadPlaceholder("Economic Calendar","Upcoming high-impact events.");
  else if (h === "#signals") loadPlaceholder("Trading Signals","Educational market bias and setups.");
  else loadDashboard();
}

// ================= INIT =================
window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
