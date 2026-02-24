<?php
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => false,
  'httponly' => true,
  'samesite' => 'Lax'
]);
session_start();

// Check if logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
  header("Location: ../pages/login.html");
  exit();
}

$username = $_SESSION['username'] ?? 'User';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Apartment Management</title>
    <link rel="stylesheet" href="../styles/dashboard.css">
</head>
<body>
    <!-- Navbar / Tabs -->
    <div class="navbar">
        <div class="brand">🏠 Admin Dashboard</div>
        <div class="navbar-right">
            <button class="nav-btn active" id="tab-apartments">📋 Apartments</button>
            <button class="nav-btn" id="tab-messages">💬 Messages</button>
            <button class="nav-btn" id="logout-btn">🚪 Logout</button>
        </div>
    </div>

    <!-- Apartments View -->
    <div id="view-apartments" class="page">
        <div class="offers" id="offers"></div>
    </div>

    <!-- Messages View -->
    <div id="view-messages" class="page hidden">
        <div class="messages" id="messages"></div>
    </div>

    <!-- Scripts -->
    <script src="../js/dashboard.js"></script>
    <script>
        // Tab switching
        document.getElementById('tab-apartments').addEventListener('click', () => {
            setActiveTab('apartments');
        });

        document.getElementById('tab-messages').addEventListener('click', () => {
            setActiveTab('messages');
        });

        // Logout handler
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../pages/login.html';
            }
        });

        // Update active tab styling
        function setActiveTabButton(tab) {
            const apartments = document.getElementById('tab-apartments');
            const messages = document.getElementById('tab-messages');
            
            if (tab === 'messages') {
                apartments.classList.remove('active');
                messages.classList.add('active');
            } else {
                messages.classList.remove('active');
                apartments.classList.add('active');
            }
        }

        // Hook into dashboard.js setActiveTab
        const originalSetActiveTab = setActiveTab;
        window.setActiveTab = function(tab) {
            originalSetActiveTab(tab);
            setActiveTabButton(tab);
        };
    </script>
</body>
</html>
