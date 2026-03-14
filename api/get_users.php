<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

$dbPath = __DIR__ . '/../data/app.db';

try {
  $pdo = new PDO('sqlite:' . $dbPath);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $pdo->exec("
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      created_at TEXT NOT NULL
    )
  ");

  $stmt = $pdo->query("
    SELECT id, title, description, category, lat, lon, created_at
    FROM places
    ORDER BY id DESC
    LIMIT 200
  ");

  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($rows as &$r) {
    $r['lat'] = (float)$r['lat'];
    $r['lon'] = (float)$r['lon'];
  }

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(["error" => "DB error: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}