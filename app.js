const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

let dashboardInterval = null;

// ================= DATA =================
async function fetchRates() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  const data = await res.json();
  return data.rates;
}

// ================= DASHBOARD =================
async function loadDashboard() {
  if (dashboardInterval) clearInterval(dashboardInterval);
  await updateDashboard();
  dashboardInterval = setInterval(updateDashboard, 30000);
}

async function updateDashboard() {
  const r = await fetchRates();

  const pairs = [
    ["EUR/USD", r.EUR],
    ["GBP/USD", r.GBP],
    ["USD/JPY", r.JPY],
    ["USD/CHF", r.CHF],
    ["AUD/USD", r.AUD],
    ["USD/CAD", r.CAD]
  ];

  ticker.innerHTML = pairs
    .map(p => `${p[0]} <strong>${p[1].toFixed(4)}</strong>`)
    .join(" &nbsp; • &nbsp; ");

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex <span>Trading Intelligence</span></h1>
      <p>Real-time prices, market analysis, economic calendar and AI-style insights.</p>
    </section>

    <section class="grid">
      ${pairs.map(p => priceCard(p[0], p[1])).join("")}
    </section>

    <section class="card" style="margin-top:40px;">
      <h3>🤖 Market Summary</h3>
      <p>The US Dollar remains firm across majors while risk assets show mixed momentum. Traders are closely monitoring upcoming macro catalysts.</p>
    </section>
  `;
}

function priceCard(pair, price) {
  return `
    <div class="card">
      <h3>${pair}</h3>
      <div class="price">${price.toFixed(4)}</div>
    </div>
  `;
}

// ================= PLACEHOLDER PAGES =================
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

  if (h === "#news") loadPlaceholder("Market News", "Latest forex and macroeconomic headlines.");
  else if (h === "#calendar-today") loadPlaceholder("Economic Calendar", "Upcoming high-impact events.");
  else if (h === "#signals") loadPlaceholder("Trading Signals", "Educational market bias and setups.");
  else loadDashboard();
}

// ================= INIT =================
window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
