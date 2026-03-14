<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
?>
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mapa</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <link rel="stylesheet" href="assets/style.css" />
  <script defer src="assets/app.js"></script>
</head>
<body>
  <header class="bar">
    <h1>Mapa</h1>
    <div class="hint">Klikni do mapy pro výběr polohy nebo použij „Moje poloha“.</div>
  </header>

  <main class="layout">
    <section class="panel">
      <h2>Přidat místo</h2>

      <form id="addForm">
        <label>Název místa</label>
        <input id="title" type="text" maxlength="100" required />

        <label>Kategorie</label>
        <select id="category">
          <option value="hidden">Skryté místo</option>
          <option value="known">Známé místo</option>
        </select>

        <label>Popisek</label>
        <textarea id="description" rows="4" placeholder="Co je na tomto místě zajímavého nebo hezkého?"></textarea>

        <div class="row">
          <label>Latitude:
            <input id="lat" name="lat" type="number" step="any" placeholder="50.0755" required />
          </label>
          <label>Longitude:
            <input id="lon" name="lon" type="number" step="any" placeholder="14.4378" required />
          </label>
        </div>

        <div class="row buttons">
          <button type="button" id="btnLocate">Moje poloha</button>
          <button type="submit" id="btnAdd">Přidat</button>
        </div>

        <div class="row">
          <label>Radius „v okolí“ (km):
            <select id="radiusKm">
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5" selected>5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>
          <button type="button" id="btnNearby">Ukázat v okolí</button>
        </div>

        <div id="status" class="status"></div>
      </form>

      <h2>Místa v okolí</h2>
      <div id="nearbyList" class="list">
        <div class="muted">Zatím žádná místa — nastav polohu a klikni „Ukázat v okolí“.</div>
      </div>
    </section>

    <section class="mapWrap">
      <div id="map"></div>
    </section>
  </main>
</body>
</html>