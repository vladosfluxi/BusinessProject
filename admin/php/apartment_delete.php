<?php
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false, // true if HTTPS
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
$raw = file_get_contents("php://input");
$body = json_decode($raw, true);
if (!is_array($body) || !isset($body["id"])) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid JSON. Expected { id }"]);
  exit();
}
$id = (int)$body["id"];
$jsonPath = __DIR__ . "/../../data/apartment.json";
if (!file_exists($jsonPath)) {
  http_response_code(500);
  echo json_encode(["error" => "Data file missing"]);
  exit();
}
$offers = json_decode(file_get_contents($jsonPath), true);
if (!is_array($offers)) $offers = [];

// Find the apartment to get its assetsDir
$apartmentToDelete = null;
foreach ($offers as $offer) {
  if (isset($offer["id"]) && (int)$offer["id"] === $id) {
    $apartmentToDelete = $offer;
    break;
  }
}

// Remove apartment from JSON
$before = count($offers);
$offers = array_values(array_filter($offers, function ($o) use ($id) {
  return !isset($o["id"]) || (int)$o["id"] !== $id;
}));
if (count($offers) === $before) {
  http_response_code(404);
  echo json_encode(["error" => "Not found"]);
  exit();
}

// Delete assets folder if it exists
if ($apartmentToDelete && isset($apartmentToDelete["assetsDir"])) {
  $assetDir = __DIR__ . "/.." . $apartmentToDelete["assetsDir"];
  
  // Normalize path to prevent directory traversal attacks
  $assetDir = realpath($assetDir);
  $allowedBase = realpath(__DIR__ . "/../..");
  
  // Only allow deletion if the path is within the assets directory
  if ($assetDir && strpos($assetDir, $allowedBase) === 0 && is_dir($assetDir)) {
    deleteDirectory($assetDir);
  }
}

// Write atomically
$tmp = $jsonPath . ".tmp";
file_put_contents($tmp, json_encode($offers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $jsonPath);
echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);

/**
 * Recursively delete a directory and all its contents
 */
function deleteDirectory($dir) {
  if (!is_dir($dir)) return false;
  
  $files = array_diff(scandir($dir), ['.', '..']);
  foreach ($files as $file) {
    $path = $dir . DIRECTORY_SEPARATOR . $file;
    if (is_dir($path)) {
      deleteDirectory($path);
    } else {
      unlink($path);
    }
  }
  return rmdir($dir);
}
