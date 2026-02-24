<?php
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => true,
  'samesite' => 'Lax'
]);
session_start();

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
  http_response_code(401);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode(["error" => "Unauthorized"]);
  exit();
}

header("Content-Type: application/json; charset=utf-8");

$jsonPath = __DIR__ . "/../../data/apartment.json";

if (!file_exists($jsonPath)) {
  echo json_encode([], JSON_UNESCAPED_UNICODE);
  exit();
}

$content = file_get_contents($jsonPath);
$apartments = json_decode($content, true);

if (!is_array($apartments)) {
  $apartments = [];
}

echo json_encode($apartments, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
