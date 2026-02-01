console.log("✅ app.js loaded");

const API_BASE = ""; 
// leave empty if using Vercel rewrites

const content = document.getElementById("content");

// ---------- helpers ----------
function showLoading(text) {
  content.innerHTML = `<p>${text}</p>`;
}

function showError(err) {
  content.innerHTML = `<p style="color:red;">❌ ${err}</p>`;
}

// ---------- NEWS ----------
async function loadNews() {
  showLoading("Loading Forex News...");
  try {
    const res = await fetch(`${API_BASE}/api/news`);
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();

    content.innerHTML = data.map(n => `
      <div class="card">
        <h3>${n.title}</h3>
        <small>${n.source}</small><br>
        <a href="${n.link}" target="_blank">Read more</a>
      </div>
    `).join("");
  } catch (err) {
    showError(err.message);
  }
}

// ---------- EVENTS ----------
async function loadEvents(offset) {
  showLoading("Loading Economic Calendar...");
  try {
    const res = await fetch(`${API_BASE}/api/events?day=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch events");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No high/medium impact events.</p>";
      return;
    }

    content.innerHTML = data.map(e => `
      <div class="card">
        <h3>${e.title}</h3>
        <p>
          ${formatDate(e)} ${formatTime(e)}<br>
          Impact: ${e.impact}<br>
          Actual: ${e.actual || "N/A"} |
          Forecast: ${e.forecast || "N/A"} |
          Previous: ${e.previous || "N/A"}
        </p>
      </div>
    `).join("");
  } catch (err) {
    showError(err.message);
  }
}

function formatDate(e) {
  if (e.timestamp) return new Date(e.timestamp * 1000).toISOString().split("T")[0];
  if (e.date) return new Date(e.date).toISOString().split("T")[0];
  return "";
}

function formatTime(e) {
  if (e.timestamp)
    return new Date(e.timestamp * 1000)
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return "";
}

// ---------- FORECAST ----------
async function loadForecast() {
  showLoading("Loading Forecast...");
  try {
    const res = await fetch(`${API_BASE}/api/forecast`);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    const data = await res.json();

    content.innerHTML = data.map(f => `
      <div class="card">
        <h3>${f.symbol}</h3>
        <p>
          Bias: <b>${f.bias}</b><br>
          Last price: ${f.last ?? "N/A"}
        </p>
      </div>
    `).join("");
  } catch (err) {
    showError(err.message);
  }
}

// ---------- SIGNALS ----------
async function loadSignals() {
  showLoading("Loading Market Signals...");
  try {
    const res = await fetch(`${API_BASE}/api/signals`);
    if (!res.ok) throw new Error("Failed to fetch signals");
    const data = await res.json();

    content.innerHTML = `
      <p style="color:orange;">
        ⚠️ Educational analysis only. Not financial advice.
      </p>
    ` + data.map(s => `
      <div class="card">
        <h3>${s.symbol} (${s.timeframe})</h3>
        <p>
          Bias: <b>${s.bias}</b><br>
          Expected Move: <b>${s.expectedMove}</b><br>
          Entry Zone: ${s.entryZone[0]} – ${s.entryZone[1]}<br>
          Target: ${s.target || "—"}<br>
          Invalidation: ${s.invalidation || "—"}<br>
          Confidence: ${s.confidence}
        </p>
      </div>
    `).join("");
  } catch (err) {
    showError(err.message);
  }
}

// ---------- ROUTER ----------
function handleRoute() {
  const h = window.location.hash;
  if (h === "#calendar-today") loadEvents(0);
  else if (h === "#calendar-tomorrow") loadEvents(1);
  else if (h === "#forecast") loadForecast();
  else if (h === "#signals") loadSignals();
  else loadNews();
}

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
