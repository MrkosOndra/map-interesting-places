<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

$dbPath = __DIR__ . '/../data/app.db';

function bad($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(["ok" => false, "error" => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!is_array($data)) bad("Neplatná data.");

$title = trim((string)($data["title"] ?? ""));
$description = trim((string)($data["description"] ?? ""));
$category = trim((string)($data["category"] ?? ""));
$lat = $data["lat"] ?? null;
$lon = $data["lon"] ?? null;

if ($title === "") bad("Název místa je povinný.");
if (strlen($title) > 100) bad("Název místa je moc dlouhý (max 100 znaků).");
if (!is_numeric($lat) || !is_numeric($lon)) bad("Souřadnice musí být čísla.");

$lat = (float)$lat;
$lon = (float)$lon;

if ($lat < -90 || $lat > 90) bad("Latitude mimo rozsah.");
if ($lon < -180 || $lon > 180) bad("Longitude mimo rozsah.");

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

  $createdAt = date('Y-m-d H:i:s');

  $stmt = $pdo->prepare("
    INSERT INTO places (title, description, category, lat, lon, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  ");
  $stmt->execute([$title, $description, $category, $lat, $lon, $createdAt]);

  echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  bad("DB error: " . $e->getMessage(), 500);
}