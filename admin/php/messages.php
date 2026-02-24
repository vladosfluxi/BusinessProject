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

// File location: /opt/BusinessProject/data.txt
// __DIR__ is: /opt/BusinessProject/admin/php
// Path needed: /opt/BusinessProject/admin/php/../../data.txt = /opt/BusinessProject/data.txt
$jsonPath = __DIR__ . "/../../data.json";

// Debug info
$debugInfo = [
  "dir" => __DIR__,
  "calculated_path" => $jsonPath,
  "realpath" => realpath($jsonPath),
  "file_exists" => file_exists($jsonPath)
];

if (!file_exists($jsonPath)) {
  echo json_encode([
    "messages" => [],
    "debug" => $debugInfo,
    "error" => "Messages file not found at: " . $jsonPath
  ], JSON_UNESCAPED_UNICODE);
  exit();
}

// Read the file
$content = file_get_contents($jsonPath);

if ($content === false) {
  echo json_encode([
    "messages" => [],
    "error" => "Could not read messages file"
  ], JSON_UNESCAPED_UNICODE);
  exit();
}

$content = trim($content);

if (empty($content)) {
  echo json_encode(["messages" => []], JSON_UNESCAPED_UNICODE);
  exit();
}

// Decode JSON
$decoded = json_decode($content, true);

if ($decoded === null) {
  echo json_encode([
    "messages" => [],
    "error" => "Invalid JSON in data.txt",
    "json_error" => json_last_error_msg()
  ], JSON_UNESCAPED_UNICODE);
  exit();
}

// Extract messages array
$messages = [];

if (is_array($decoded)) {
  // If it's an array of objects (list of messages)
  if (count($decoded) > 0 && is_array($decoded[0])) {
    $messages = $decoded;
  } 
  // If it's wrapped: { "messages": [...] }
  else if (isset($decoded['messages']) && is_array($decoded['messages'])) {
    $messages = $decoded['messages'];
  }
  // If it's a single message object, wrap it
  else if (isset($decoded['fullName']) || isset($decoded['email'])) {
    $messages = [$decoded];
  }
}

echo json_encode(["messages" => $messages], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
