const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

let dashboardInterval = null;
let lastRates = null;

/* ================= FORMAT ================= */
function formatPrice(symbol, value) {
  if (!value) return "—";
  if (symbol.includes("JPY")) return value.toFixed(3);
  if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("XAU"))
    return value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  return value.toFixed(5);
}

/* ================= FETCH DATA ================= */
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

/* ================= DASHBOARD ================= */
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

  ticker.innerHTML =
    assets.map(a => `<span>${a[0]} <strong>${formatPrice(a[0],a[1])}</strong></span>`).join(" • ")
    + " • " +
    assets.map(a => `<span>${a[0]} <strong>${formatPrice(a[0],a[1])}</strong></span>`).join(" • ");

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex <span>Trading Intelligence</span></h1>
      <p>Real-time prices, market analysis, economic calendar and AI-style insights.</p>
    </section>
    <section class="grid">
      ${assets.map(a => `
        <div class="card">
          <h3>${a[0]}</h3>
          <div class="price">${formatPrice(a[0],a[1])}</div>
        </div>`).join("")}
    </section>
  `;
}

/* ================= NEWS (MULTI-SOURCE) ================= */
async function loadNews() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  content.innerHTML = `
    <section class="hero">
      <h1>Global <span>Forex News</span></h1>
      <p>Headlines from leading forex publishers.</p>
    </section>
    <section id="news" class="grid"></section>
  `;

  const feeds = [
    "https://www.fxstreet.com/rss/news",
    "https://www.forexlive.com/feed/",
    "https://www.dailyfx.com/feeds/market-news",
    "https://www.babypips.com/feed",
    "https://www.coindesk.com/arc/outboundfeeds/rss/"
  ];

  let all = [];

  for (const f of feeds) {
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(f)}`);
      const xml = new DOMParser().parseFromString((await res.json()).contents,"text/xml");
      [...xml.querySelectorAll("item")].forEach(i=>{
        all.push({
          title: i.querySelector("title")?.textContent,
          link: i.querySelector("link")?.textContent,
          source: new URL(f).hostname.replace("www.","")
        });
      });
    } catch {}
  }

  const unique = [...new Map(all.map(i=>[i.title,i])).values()].slice(0,20);

  document.getElementById("news").innerHTML = unique.map(n=>`
    <div class="card">
      <h3>${n.title}</h3>
      <p style="color:#9ca3af">${n.source}</p>
      <a href="${n.link}" target="_blank" style="color:#60a5fa">Read →</a>
    </div>
  `).join("");
}

/* ================= SIGNAL ENGINE + CONFIDENCE ================= */
function generateSignals(current, previous) {
  const signals = [];

  for (const k in current) {
    if (!previous || !previous[k]) continue;

    const change = ((current[k] - previous[k]) / previous[k]) * 100;
    let bias = "Neutral", color = "var(--muted)";
    let confidence = Math.min(Math.abs(change) * 40, 100);

    if (change > 0.15) { bias = "Bullish Bias"; color = "var(--green)"; }
    else if (change < -0.15) { bias = "Bearish Bias"; color = "var(--red)"; }

    signals.push({ pair:k, bias, change:change.toFixed(2), confidence:confidence.toFixed(0), color });
  }
  return signals;
}

async function loadSignals() {
  if (dashboardInterval) clearInterval(dashboardInterval);

  const rates = await fetchRates();
  const signals = generateSignals(rates, lastRates);
  lastRates = rates;

  content.innerHTML = `
    <section class="hero">
      <h1>AI-Style <span>Signals</span></h1>
      <p>Educational market bias derived from live data.</p>
    </section>
    <section class="grid">
      ${signals.length === 0 ? `<div class="card">Signals will appear after next update.</div>` :
        signals.map(s=>`
          <div class="card">
            <h3>${s.pair}</h3>
            <p style="color:${s.color}">${s.bias} (${s.change}%)</p>
            <span class="badge" style="background:${s.color}20;color:${s.color}">
              Confidence: ${s.confidence}%
            </span>
          </div>`).join("")
      }
    </section>
  `;
}

/* ================= CALENDAR ================= */
function loadCalendar() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  content.innerHTML = `
    <section class="hero">
      <h1>Economic <span>Calendar</span></h1>
      <p>Impact-based macro events.</p>
    </section>
    <section class="grid">
      <div class="card"><h3>🔴 High Impact</h3><p>Rate decisions, CPI, NFP</p></div>
      <div class="card"><h3>🟠 Medium Impact</h3><p>GDP, PMIs, Employment</p></div>
      <div class="card"><h3>🟢 Low Impact</h3><p>Secondary indicators</p></div>
    </section>
  `;
}

/* ================= ROUTER ================= */
function handleRoute() {
  const h = location.hash;
  if (h === "#news") loadNews();
  else if (h === "#signals") loadSignals();
  else if (h === "#calendar") loadCalendar();
  else loadDashboard();
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
