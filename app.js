const content = document.getElementById("content");
const ticker = document.getElementById("ticker");
let dashboardInterval = null;

/* ---------- FORMAT ---------- */
function formatPrice(symbol, value) {
  if (!value) return "—";
  if (symbol.includes("JPY")) return value.toFixed(3);
  if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("XAU"))
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(5);
}

/* ---------- FETCH DATA ---------- */
async function fetchRates() {
  const [fx, crypto, metals] = await Promise.all([
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd").then(r => r.json()),
    fetch("https://metals-api.com/api/latest?base=USD&symbols=XAU").then(r => r.json()).catch(() => null)
  ]);

  return {
    EURUSD: 1 / fx.rates.EUR,
    GBPUSD: 1 / fx.rates.GBP,
    AUDUSD: 1 / fx.rates.AUD,
    USDJPY: fx.rates.JPY,
    USDCHF: fx.rates.CHF,
    USDCAD: fx.rates.CAD,
    XAUUSD: metals?.rates?.XAU ? 1 / metals.rates.XAU : null,
    BTCUSD: crypto.bitcoin.usd,
    ETHUSD: crypto.ethereum.usd
  };
}

/* ---------- DASHBOARD ---------- */
async function loadDashboard() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  updateDashboard();
  dashboardInterval = setInterval(updateDashboard, 30000);
}

async function updateDashboard() {
  const r = await fetchRates();
  const assets = [
    ["EUR/USD", r.EURUSD], ["GBP/USD", r.GBPUSD], ["USD/JPY", r.USDJPY],
    ["USD/CHF", r.USDCHF], ["AUD/USD", r.AUDUSD], ["USD/CAD", r.USDCAD],
    ["XAU/USD", r.XAUUSD], ["BTC/USD", r.BTCUSD], ["ETH/USD", r.ETHUSD]
  ];

  ticker.innerHTML = assets.map(a =>
    `<span>${a[0]} <strong>${formatPrice(a[0], a[1])}</strong></span>`
  ).join(" • ").repeat(2);

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex <span>Trading Intelligence</span></h1>
      <p>Real-time prices, market analysis, economic calendar and insights.</p>
    </section>
    <section class="grid">
      ${assets.map(a => `
        <div class="card">
          <h3>${a[0]}</h3>
          <div class="price">${formatPrice(a[0], a[1])}</div>
        </div>`).join("")}
    </section>
  `;
}

/* ---------- NEWS ---------- */
async function loadNews() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  content.innerHTML = `
    <section class="hero">
      <h1>Market <span>News</span></h1>
      <p>Latest forex headlines.</p>
    </section>
    <section id="news" class="grid"></section>
  `;

  const rss = "https://www.fxstreet.com/rss/news";
  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rss)}`);
  const xml = new DOMParser().parseFromString((await res.json()).contents, "text/xml");
  const items = [...xml.querySelectorAll("item")].slice(0, 10);

  document.getElementById("news").innerHTML = items.map(i => `
    <div class="card">
      <h3>${i.querySelector("title").textContent}</h3>
      <a href="${i.querySelector("link").textContent}" target="_blank" style="color:#60a5fa">
        Read article →
      </a>
    </div>
  `).join("");
}

/* ---------- CALENDAR ---------- */
async function loadCalendar() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  content.innerHTML = `
    <section class="hero">
      <h1>Economic <span>Calendar</span></h1>
      <p>Upcoming macroeconomic events.</p>
    </section>
    <section class="grid">
      <div class="card"><h3>🔴 High Impact</h3><p>Interest Rate Decisions</p></div>
      <div class="card"><h3>🟠 Medium Impact</h3><p>Inflation & Employment</p></div>
      <div class="card"><h3>🟢 Low Impact</h3><p>Secondary indicators</p></div>
    </section>
  `;
}

/* ---------- ROUTER ---------- */
function handleRoute() {
  const h = location.hash;
  if (h === "#news") loadNews();
  else if (h === "#calendar") loadCalendar();
  else if (h === "#analysis") loadCalendar();
  else if (h === "#signals") loadCalendar();
  else loadDashboard();
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
