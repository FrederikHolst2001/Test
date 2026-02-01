// ================= CONFIG =================
const API_BASE = ""; 
// If using Vercel rewrites, leave empty.
// If NOT using rewrites, set:
// const API_BASE = "https://forex-backend-sq8t.onrender.com";

const content = document.getElementById("content");

// ================= HELPERS =================
function showLoading(text = "Loading...") {
  content.innerHTML = `<p>${text}</p>`;
}

function showError(err) {
  content.innerHTML = `<p style="color:red;">❌ ${err}</p>`;
}

// ================= NEWS =================
async function loadNews() {
  showLoading("Loading Forex News...");
  try {
    const res = await fetch(`${API_BASE}/api/news`);
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No news available.</p>";
      return;
    }

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

// ================= EVENTS =================
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
        <h3>
          ${formatDate(e)} ${formatTime(e)} ${e.country || ""}
        </h3>
        <b>${e.title}</b>
        <p>
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
  if (e.date)
    return new Date(e.date)
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return "";
}

// ================= FORECAST =================
async function loadForecast() {
  showLoading("Loading Market Forecast...");
  try {
    const res = await fetch(`${API_BASE}/api/forecast`);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = "<p>No forecast data.</p>";
      return;
    }

    content.innerHTML = data.map(f => `
      <div class="card">
        <h3>${f.symbol}</h3>
        <p>
          Bias: <b>${f.bias}</b><br>
          Last Price: ${f.last?.toFixed(4) || "N/A"}
        </p>
      </div>
    `).join("");
  } catch (err) {
    showError(err.message);
  }
}

// ================= ROUTING =================
function handleRoute() {
  const hash = window.location.hash;

  if (hash === "#news") loadNews();
  else if (hash === "#calendar-today") loadEvents(0);
  else if (hash === "#calendar-tomorrow") loadEvents(1);
  else if (hash === "#forecast") loadForecast();
  else loadNews(); // default
}

window.addEventListener("hashchange", handleRoute);
window.addEventListener("load", handleRoute);

// ================= REALTIME (OPTIONAL) =================
// Enable ONLY if you want live updates
/*
const evt = new EventSource(`${API_BASE}/api/stream`);
evt.onmessage = e => {
  if (window.location.hash === "#news") {
    const data = JSON.parse(e.data);
    content.innerHTML = data.map(n => `
      <div class="card">
        <h3>${n.title}</h3>
        <small>${n.source}</small><br>
        <a href="${n.link}" target="_blank">Read more</a>
      </div>
    `).join("");
  }
};
*/
