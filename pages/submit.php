<?php
// Sanitize input to prevent injection
$newMessage = [
  "fullName" => isset($_POST["fullName"]) ? htmlspecialchars($_POST["fullName"]) : "",
  "email" => isset($_POST["email"]) ? htmlspecialchars($_POST["email"]) : "",
  "phone" => isset($_POST["phone"]) ? htmlspecialchars($_POST["phone"]) : "",
  "subject" => isset($_POST["subject"]) ? htmlspecialchars($_POST["subject"]) : "",
  "message" => isset($_POST["message"]) ? htmlspecialchars($_POST["message"]) : ""
];

// Path to messages file
$messageFile = "../data.json";

// Read existing messages
$messages = [];
if (file_exists($messageFile)) {
  $content = file_get_contents($messageFile);
  $decoded = json_decode($content, true);
  
  if (is_array($decoded)) {
    $messages = $decoded;
  }
}

// Add new message
$messages[] = $newMessage;

// Write back as proper JSON
$file = fopen($messageFile, "w");
if ($file) {
  fwrite($file, json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  fclose($file);
}
?>
<script>
alert("Thanks for leaving your message, we will get back to you soon!");
window.location.replace("http://64.226.84.191/index.html");
</script>
