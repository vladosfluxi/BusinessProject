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

$jsonPath = __DIR__ . "/../../data/messages.json";

if (!file_exists($jsonPath)) {
  echo json_encode(["messages" => []], JSON_UNESCAPED_UNICODE);
  exit();
}

$messages = json_decode(file_get_contents($jsonPath), true);

if (!is_array($messages)) {
  $messages = [];
}

echo json_encode(["messages" => $messages], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
