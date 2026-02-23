document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // prevent page reload

    // Get and trim values
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    // Hash the password using sha256
    const hash = sha256(password);

    // Build URL with query parameters
    const url = `../php/admin.php?username=${encodeURIComponent(username)}&hash=${encodeURIComponent(hash)}`;

    // Send request
    fetch(url, {
      method: "GET"
    })
    .then(response => response.text())
    .then(data => {
      console.log("Server response:", data);
    })
    .catch(error => {
      console.error("Error:", error);
    });
  });
});
