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

$id = $data["id"] ?? null;

if (!is_numeric($id)) bad("Neplatné ID.");

$id = (int)$id;

try {
  $pdo = new PDO('sqlite:' . $dbPath);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $stmt = $pdo->prepare("DELETE FROM places WHERE id = ?");
  $stmt->execute([$id]);

  echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  bad("DB error: " . $e->getMessage(), 500);
}