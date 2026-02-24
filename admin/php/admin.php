<?php
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => true,
  'samesite' => 'Lax'
]);


session_start();

$EXPECTED_USERNAME = 'ivonvip';

// Get username and hash (works for GET or POST)
$username = isset($_REQUEST['username']) ? trim($_REQUEST['username']) : '';
$hash     = isset($_REQUEST['hash']) ? trim($_REQUEST['hash']) : '';

// Path to stored hash
$hashFile = __DIR__ . '/../data/password.txt';
$storedHash = is_readable($hashFile) ? trim(file_get_contents($hashFile)) : '';

if (
    $username === $EXPECTED_USERNAME &&
    $storedHash !== '' &&
    hash_equals($storedHash, $hash)
) {
    $_SESSION['logged_in'] = true;
    header("Location: dashboard.php");
    exit;
}

// If login fails
header("Location: ../pages/login.html");
exit;
?>
