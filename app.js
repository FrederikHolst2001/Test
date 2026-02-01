const content = document.getElementById("content");
const ticker = document.getElementById("ticker");

// ================= MARKET DATA =================
async function fetchRates() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  const data = await res.json();
  return data.rates;
}

// ================= DASHBOARD =================
async function loadDashboard() {
  const rates = await fetchRates();

  // TICKER
  const tickerPairs = [
    ["EUR/USD", rates.EUR],
    ["GBP/USD", rates.GBP],
    ["USD/JPY", rates.JPY],
    ["USD/CHF", rates.CHF],
    ["AUD/USD", rates.AUD],
    ["USD/CAD", rates.CAD]
  ];

  ticker.innerHTML = tickerPairs.map(p =>
    `${p[0]} <strong>${p[1].toFixed(4)}</strong>`
  ).join(" &nbsp; | &nbsp; ");

  content.innerHTML = `
    <section class="hero">
      <h1>Professional Forex Trading Intelligence</h1>
      <p>Real-time prices, market analysis, economic calendar and signals</p>
    </section>

    <section class="grid">
      ${priceCard("EUR/USD", rates.EUR)}
      ${priceCard("GBP/USD", rates.GBP)}
      ${priceCard("USD/JPY", rates.JPY)}
      ${priceCard("USD/CHF", rates.CHF)}
      ${priceCard("AUD/USD", rates.AUD)}
      ${priceCard("USD/CAD", rates.CAD)}
    </section>

    <section class="card overview">
      <h3>Market Overview</h3>
      <p>USD strength remains the primary driver across FX markets.</p>
      <p>Gold and crypto show increased volatility during US sessions.</p>
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

// ================= ROUTER =================
function handleRoute() {
  const h = window.location.hash;

  if (h === "#news") loadNews();
  else if (h === "#calendar-today") loadEvents(0);
  else if (h === "#signals") loadSignals();
  else if (h === "#charts") loadCharts();
  else loadDashboard(); // DEFAULT
}

// ================= INIT =================
window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
