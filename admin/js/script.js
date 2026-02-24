document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    const hash = sha256(password);

    window.location.href = `../php/admin.php?username=${encodeURIComponent(username)}&hash=${encodeURIComponent(hash)}`;
  });
});

