let map;
let pickedMarker = null;
let userMarkers = [];
let myPos = null;

function setStatus(msg, ok = true) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + (ok ? "ok" : "err");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function getMarkerColor(category) {
  if (category === "hidden") return "green";
  if (category === "known") return "blue";
  return "red";
}

function setPicked(lat, lon) {
  document.getElementById("lat").value = lat.toFixed(6);
  document.getElementById("lon").value = lon.toFixed(6);

  myPos = { lat, lon };

  if (pickedMarker) {
    pickedMarker.remove();
  }

  pickedMarker = L.circleMarker([lat, lon], {
    radius: 10,
    color: "orange",
    fillColor: "orange",
    fillOpacity: 0.8
  })
    .addTo(map)
    .bindPopup("Vybrané místo")
    .openPopup();
}

function clearUserMarkers() {
  for (const m of userMarkers) m.remove();
  userMarkers = [];
}

async function fetchUsers() {
  const res = await fetch("api/get_users.php");
  if (!res.ok) throw new Error("Nepodařilo se načíst místa");
  return await res.json();
}

function renderUsers(users) {
  clearUserMarkers();

  for (const u of users) {

    const popupHtml = `
      <b>${escapeHtml(u.title)}</b><br>
      ${escapeHtml(u.description || "")}<br>
      <small>${u.category}</small><br>
      ${u.lat.toFixed(6)}, ${u.lon.toFixed(6)}<br>
      <small>${u.created_at}</small><br><br>

      <button data-del="${u.id}" class="delete-btn">
        Smazat místo
      </button>
    `;

    const markerColor = getMarkerColor(u.category);

    const m = L.circleMarker([u.lat, u.lon], {
      radius: 8,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.8
    })
      .addTo(map)
      .bindPopup(popupHtml);

    m.on("popupopen", () => {
      const btn = document.querySelector(`button[data-del="${u.id}"]`);
      if (!btn) return;

      btn.onclick = async () => {
        try {

          await deleteUser(u.id);

          const users = await fetchUsers();
          renderUsers(users);

          setStatus("Místo smazáno.");

        } catch (err) {
          setStatus(err.message, false);
        }
      };
    });

    userMarkers.push(m);
  }
}

function haversineKm(a, b) {
  const R = 6371;

  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function showNearby(users) {
  const list = document.getElementById("nearbyList");

  if (!myPos) {
    list.innerHTML =
      `<div class="muted">Nejdřív vyber polohu (klik v mapě nebo „Moje poloha“).</div>`;
    return;
  }

  const radiusKm =
    Number(document.getElementById("radiusKm").value);

  const nearby = users
    .map(u => ({
      ...u,
      dist: haversineKm(myPos, { lat: u.lat, lon: u.lon })
    }))
    .filter(u => u.dist <= radiusKm)
    .sort((x, y) => x.dist - y.dist);

  if (nearby.length === 0) {
    list.innerHTML =
      `<div class="muted">V okruhu ${radiusKm} km není žádné místo.</div>`;
    return;
  }

  list.innerHTML = nearby.map(u => `
    <div class="item">

      <b>${escapeHtml(u.title)}</b><br>
      ${escapeHtml(u.description || "")}<br>

      Vzdálenost: ${u.dist.toFixed(2)} km<br>

      <small>
        ${u.lat.toFixed(6)}, ${u.lon.toFixed(6)}
      </small>

    </div>
  `).join("");
}

async function addUser(title, description, category, lat, lon) {

  const res = await fetch("api/add_user.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({
      title,
      description,
      category,
      lat,
      lon
    })
  });

  const data = await res.json();

  if (!res.ok || !data.ok)
    throw new Error(data.error || "Nepodařilo se uložit místo");

  return data;
}

async function deleteUser(id) {

  const res = await fetch("api/delete_user.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ id })
  });

  const data = await res.json();

  if (!res.ok || !data.ok)
    throw new Error(data.error || "Nepodařilo se smazat místo");

  return data;
}

window.addEventListener("DOMContentLoaded", async () => {

  map = L.map("map")
    .setView([50.0755, 14.4378], 12);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }
  ).addTo(map);

  map.on("click", (e) => {

    setPicked(e.latlng.lat, e.latlng.lng);

    setStatus("Poloha vybrána kliknutím do mapy.");

  });

  try {

    const users = await fetchUsers();

    renderUsers(users);

    setStatus(`Načteno míst: ${users.length}`);

  } catch (err) {

    setStatus(err.message, false);

  }

  document
    .getElementById("btnLocate")
    .addEventListener("click", () => {

      if (!navigator.geolocation) {

        setStatus(
          "Prohlížeč nepodporuje geolokaci.",
          false
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        (pos) => {

          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          map.setView([lat, lon], 14);

          setPicked(lat, lon);

          setStatus("Poloha načtena z geolokace.");

        },

        () =>
          setStatus(
            "Nepodařilo se získat polohu.",
            false
          ),

        { enableHighAccuracy: true, timeout: 8000 }

      );
    });

  document
    .getElementById("addForm")
    .addEventListener("submit", async (e) => {

      e.preventDefault();

      const title =
        document.getElementById("title").value.trim();

      const category =
        document.getElementById("category").value;

      const description =
        document.getElementById("description").value.trim();

      const lat =
        Number(document.getElementById("lat").value);

      const lon =
        Number(document.getElementById("lon").value);

      if (!title)
        return setStatus("Zadej název místa.", false);

      if (!Number.isFinite(lat) || !Number.isFinite(lon))
        return setStatus(
          "Zadej platné souřadnice.",
          false
        );

      try {

        await addUser(
          title,
          description,
          category,
          lat,
          lon
        );

        const users = await fetchUsers();

        renderUsers(users);

        setStatus("Místo uloženo.");

      } catch (err) {

        setStatus(err.message, false);

      }
    });

  document
    .getElementById("btnNearby")
    .addEventListener("click", async () => {

      try {

        const users = await fetchUsers();

        showNearby(users);

        setStatus("Zobrazen seznam míst v okolí.");

      } catch (err) {

        setStatus(err.message, false);

      }
    });
});