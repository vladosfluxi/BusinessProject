<?php
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => true,
  'samesite' => 'Lax'
]);


session_start();

if (!isset($_SESSION['admin']) && $_SESSION['admin'] !== true) {
    header("Location: ../pages/login.html");
    exit;
}
?>

<?php
session_start();

// If NOT logged in → redirect to login page
if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
    header("Location: ../pages/login.html");
    exit;
}

// If logged in → continue showing the page
?>

<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
    <link rel="stylesheet" href="../styles/dashboard.css">

</head>
<body>
  <div id="offers" class="offers">
  </div>
</body>
</html>

