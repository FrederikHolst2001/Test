const API = import.meta?.env?.VITE_API_BASE || "";

fetch(`${API}/api/news`);