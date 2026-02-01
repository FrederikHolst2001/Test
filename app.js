console.log("✅ app.js loaded");

// ================= CONFIG =================
const API_BASE = "";
// Leave empty if using Vercel rewrites
// Or set to: https://forex-backend-sq8t.onrender.com

const content = document.getElementById("content");

// ================= HELPERS =================
function showLoading(text = "Loading…") {
  content.innerHTML = `<p>${text}</p>`;
}

function showError(message) {
  content.innerHTML = `<p style="color:red;">❌ ${message}</p>`;
}

function formatDate(e) {
  if (e.timestamp)
    return new Date(e.timestamp * 1000).toISOString().split("T")[0];
  if (e.date)
    return new Date(e.date).toISOString().split("T")[0];
  return "";
}

function formatTime(e) {
  if (e.timestamp)
    return new Date(e.timestamp * 1000)
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return "";
}

// ================= NEWS =================
async function loadNews() {
  showLoading("Loading Forex News…");
  try {
    const res = await fetch(`${API_BASE}/api/news`);
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No news available.</p>";
      return;
    }

    content.innerHTML = data.map(n => `
      <article class="card">
        <h3>${n.title}</h3>
        <p>
          <strong>${n.source}</strong><br>
          <a href="${n.link}" target="_blank">Read full article →</a>
        </p>
      </article>
    `).join("");

  } catch (err) {
    showError(err.message);
  }
}

// ================= ECONOMIC CALENDAR =================
async function loadEvents(offset) {
  showLoading("Loading Economic Calendar…");
  try {
    const res = await fetch(`${API_BASE}/api/events?day=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch events");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No high or medium impact events.</p>";
      return;
    }

    content.innerHTML = data.map(e => `
      <article class="card">
        <h3>${e.title}</h3>
        <p>
          ${formatDate(e)} ${formatTime(e)}<br>
          Impact: <strong>${e.impact}</strong><br>
          Actual: ${e.actual || "N/A"} |
          Forecast: ${e.forecast || "N/A"} |
          Previous: ${e.previous || "N/A"}
        </p>
      </article>
    `).join("");

  } catch (err) {
    showError(err.message);
  }
}

// ================= FORECAST =================
async function loadForecast() {
  showLoading("Loading Market Forecast…");
  try {
    const res = await fetch(`${API_BASE}/api/forecast`);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No forecast data available.</p>";
      return;
    }

    content.innerHTML = data.map(f => `
      <article class="card">
        <h3>${f.symbol}</h3>
        <p>
          Bias: <strong>${f.bias}</strong><br>
          Last Price: ${f.last ?? "N/A"}
        </p>
      </article>
    `).join("");

  } catch (err) {
    showError(err.message);
  }
}

// ================= SIGNALS =================
async function loadSignals() {
  showLoading("Loading Market Signals…");
  try {
    const res = await fetch(`${API_BASE}/api/signals`);
    if (!res.ok) throw new Error("Failed to fetch signals");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No signals available.</p>";
      return;
    }

    content.innerHTML = `
      <p style="color:#b45309;">
        ⚠️ Educational market analysis only. Not financial advice.
      </p>
    ` + data.map(s => `
      <article class="card">
        <h3>${s.symbol} (${s.timeframe})</h3>
        <p>
          Bias: <strong>${s.bias}</strong><br>
          Expected Move: <strong>${s.expectedMove}</strong><br>
          Entry Zone: ${s.entryZone[0]} – ${s.entryZone[1]}<br>
          Target: ${s.target || "—"}<br>
          Invalidation: ${s.invalidation || "—"}<br>
          Confidence: ${s.confidence}
        </p>
      </article>
    `).join("");

  } catch (err) {
    showError(err.message);
  }
}

// ================= ROUTER =================
function handleRoute() {
  const hash = window.location.hash;

  if (hash === "#calendar-today") loadEvents(0);
  else if (hash === "#calendar-tomorrow") loadEvents(1);
  else if (hash === "#forecast") loadForecast();
  else if (hash === "#signals") loadSignals();
  else loadNews(); // default
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
