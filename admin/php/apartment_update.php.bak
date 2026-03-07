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
$assetsDir = realpath(__DIR__ . "/../../assets/apartments");

// Get data from request
$id = null;
$data = null;
$deleteImages = [];

if (!empty($_POST['id'])) {
  $id = (int)$_POST['id'];
  $data = json_decode($_POST['data'] ?? '{}', true);
  $deleteImages = json_decode($_POST['deleteImages'] ?? '[]', true) ?: [];
} else {
  $input = json_decode(file_get_contents("php://input"), true);
  $id = (int)($input['id'] ?? 0);
  $data = $input['data'] ?? [];
  $deleteImages = $input['deleteImages'] ?? [];
}

if (!$id || !is_array($data)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid id or data"]);
  exit();
}

// Load apartments
$apartments = [];
if (file_exists($jsonPath)) {
  $apartments = json_decode(file_get_contents($jsonPath), true) ?: [];
}

// Find apartment
$found = false;
$apartmentIndex = -1;
$apartment = null;
foreach ($apartments as $idx => $a) {
  if (isset($a['id']) && (int)$a['id'] === $id) {
    $found = true;
    $apartmentIndex = $idx;
    $apartment = $a;
    break;
  }
}

if (!$found) {
  http_response_code(404);
  echo json_encode(["error" => "Not found"]);
  exit();
}

$apartmentDir = $assetsDir . "/offer-" . $id;
if (!file_exists($apartmentDir)) {
  mkdir($apartmentDir, 0755, true);
}

// Handle thumbnail upload
if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
  $thumbFile = $_FILES['thumbnail'];
  $thumbName = "thumbnail." . strtolower(pathinfo($thumbFile['name'], PATHINFO_EXTENSION));
  $thumbPath = $apartmentDir . "/" . $thumbName;
  if (move_uploaded_file($thumbFile['tmp_name'], $thumbPath)) {
    $data['thumbnail'] = "/assets/apartments/offer-" . $id . "/" . $thumbName;
  }
}

// Start gallery from EXISTING images (not from $data which won't have 'image')
$existingImages = isset($apartment['image']) && is_array($apartment['image']) ? $apartment['image'] : [];

// Handle image deletions FIRST (delete from disk and remove from existing list)
if (!empty($deleteImages) && is_array($deleteImages)) {
  foreach ($deleteImages as $imgPath) {
    // Normalize: strip leading slash for path joining
    $relativePath = ltrim($imgPath, '/');
    $fullPath = realpath($assetsDir . "/../../" . $relativePath);

    // Security: must be inside assets/apartments
    if ($fullPath && $assetsDir && strpos($fullPath, $assetsDir) === 0 && file_exists($fullPath)) {
      unlink($fullPath);
    }
  }

  // Remove deleted images from existing list
  $existingImages = array_values(array_filter($existingImages, function($img) use ($deleteImages) {
    return !in_array($img, $deleteImages);
  }));
}

// Handle gallery uploads — append to (already-filtered) existing images
if (isset($_FILES['images'])) {
  $count = count($_FILES['images']['name']);
  // Find highest existing image number to avoid collisions
  $imgNum = count($existingImages) + 1;
  for ($i = 0; $i < $count; $i++) {
    if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
      $file = [
        'name' => $_FILES['images']['name'][$i],
        'tmp_name' => $_FILES['images']['tmp_name'][$i]
      ];
      $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
      // Use timestamp+index to guarantee unique filenames
      $filename = "image-" . time() . "-" . $imgNum . "." . $ext;
      $filepath = $apartmentDir . "/" . $filename;
      if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $existingImages[] = "/assets/apartments/offer-" . $id . "/" . $filename;
        $imgNum++;
      }
    }
  }
}

// Set the final merged image array
$data['image'] = $existingImages;

// Merge with existing apartment data
$updated = array_merge($apartment, $data);
$updated['id'] = $id;
$updated['assetsDir'] = "/assets/apartments/offer-" . $id;

// Save
$apartments[$apartmentIndex] = $updated;
$tmp = $jsonPath . ".tmp";
file_put_contents($tmp, json_encode($apartments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
rename($tmp, $jsonPath);

echo json_encode($updated, JSON_UNESCAPED_UNICODE);
