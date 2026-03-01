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
$assetsDir = __DIR__ . "/../../assets/apartments";

// Ensure directories exist
$dataDir = __DIR__ . "/../../data";
if (!file_exists($dataDir)) {
  @mkdir($dataDir, 0755, true);
}
if (!file_exists($assetsDir)) {
  @mkdir($assetsDir, 0755, true);
}

// Get data from request
$data = null;
if (!empty($_POST['data'])) {
  $data = json_decode($_POST['data'], true);
} else {
  $body = file_get_contents("php://input");
  if ($body) {
    $input = json_decode($body, true);
    $data = $input['data'] ?? null;
  }
}

if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid data"]);
  exit();
}

// Load existing apartments and generate new ID
$apartments = [];
if (file_exists($jsonPath)) {
  $apartments = json_decode(file_get_contents($jsonPath), true) ?: [];
}
$maxId = 0;
foreach ($apartments as $a) {
  if (isset($a['id'])) {
    $maxId = max($maxId, (int)$a['id']);
  }
}
$newId = $maxId + 1;

// Create apartment folder
$apartmentDir = $assetsDir . "/offer-" . $newId;
if (!file_exists($apartmentDir)) {
  @mkdir($apartmentDir, 0755, true);
}

// Handle thumbnail upload
if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
  $thumbFile = $_FILES['thumbnail'];
  $thumbName = "thumbnail." . strtolower(pathinfo($thumbFile['name'], PATHINFO_EXTENSION));
  $thumbPath = $apartmentDir . "/" . $thumbName;
  if (move_uploaded_file($thumbFile['tmp_name'], $thumbPath)) {
    $data['thumbnail'] = "/assets/apartments/offer-" . $newId . "/" . $thumbName;
  }
}

// Handle gallery uploads (supports multiple files)
$images = [];
if (isset($_FILES['images'])) {
  $count = count($_FILES['images']['name']);
  for ($i = 0; $i < $count; $i++) {
    if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
      $file = [
        'name' => $_FILES['images']['name'][$i],
        'tmp_name' => $_FILES['images']['tmp_name'][$i]
      ];
      $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
      // Use timestamp+index to guarantee unique filenames
      $filename = "image-" . time() . "-" . ($i + 1) . "." . $ext;
      $filepath = $apartmentDir . "/" . $filename;
      if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $images[] = "/assets/apartments/offer-" . $newId . "/" . $filename;
      }
    }
  }
}

// Set defaults
$data['id'] = $newId;
$data['assetsDir'] = "/assets/apartments/offer-" . $newId;
if (!isset($data['thumbnail'])) {
  $data['thumbnail'] = "/assets/apartments/apartment1.jpeg";
}
$data['image'] = $images;

// Save
$apartments[] = $data;
$tmp = $jsonPath . ".tmp";
$jsonContent = json_encode($apartments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($tmp, $jsonContent) === false) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to write apartment data"]);
  exit();
}
if (!rename($tmp, $jsonPath)) {
  if (!copy($tmp, $jsonPath)) {
    http_response_code(500);
    @unlink($tmp);
    echo json_encode(["error" => "Failed to save apartment"]);
    exit();
  }
  @unlink($tmp);
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
