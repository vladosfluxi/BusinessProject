// js/app.js
const API_URL = "/api";

function loadApartments() {
  const grid = document.querySelector(".apartments-grid");
  if (!grid) return;

  fetch(API_URL + "/apartments")
    .then(function(response) { return response.json(); })
    .then(function(apartments) {
      // Store a map of id -> apartment so switchLanguage() can re-render titles/locations
      window.__apartmentMap = {};
      apartments.forEach(function(a) {
        window.__apartmentMap[String(a.id)] = a;
      });
      displayApartments(apartments);

      // Apply current language to the freshly rendered cards
      const lang = window.currentLang || localStorage.getItem('selectedLanguage') || 'en';
      if (typeof applyListingTranslations === 'function') {
        applyListingTranslations(lang);
      }
    })
    .catch(function(error) {
      console.error("Error loading apartments:", error);
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#e74c3c;">⚠️ Unable to load apartments. Make sure the backend server is running.</p>';
    });
}

function filterApartments() {
  const form = document.getElementById("filterForm");
  if (!form) return;

  const formData = new FormData(form);
  const params = new URLSearchParams();
  for (let entry of formData.entries()) {
    if (entry[1]) params.append(entry[0], entry[1]);
  }
  form.querySelectorAll('input[name="view"]:checked').forEach(function(cb) {
    params.append("view", cb.value);
  });
  form.querySelectorAll('input[name="floor"]:checked').forEach(function(cb) {
    params.append("floor", cb.value);
  });

  fetch(API_URL + "/apartments/filter?" + params.toString())
    .then(function(response) { return response.json(); })
    .then(function(apartments) {
      // Merge into the global map
      if (!window.__apartmentMap) window.__apartmentMap = {};
      apartments.forEach(function(a) { window.__apartmentMap[String(a.id)] = a; });

      displayApartments(apartments);

      const lang = window.currentLang || localStorage.getItem('selectedLanguage') || 'en';
      if (typeof applyListingTranslations === 'function') {
        applyListingTranslations(lang);
      }
    })
    .catch(function(error) {
      console.error("Error filtering apartments:", error);
      const grid = document.querySelector(".apartments-grid");
      if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#e74c3c;">⚠️ Unable to filter apartments.</p>';
    });
}

function resolveListingImageUrl(path) {
  if (!path) return "assets/apartments/apartment1.jpeg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleaned = path.replace(/^(\.\.\/)+/, "").replace(/^\/+/, "");
  if (cleaned.startsWith("assets/")) return cleaned;
  return "assets/" + cleaned;
}

function displayApartments(apartments) {
  const grid = document.querySelector(".apartments-grid");
  if (!grid) return;

  if (!apartments || apartments.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">No apartments found matching your criteria.</p>';
    return;
  }

  const lang = window.currentLang || localStorage.getItem('selectedLanguage') || 'en';

  let html = "";
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];

    const thumb = apt.thumbnail
      || (Array.isArray(apt.image) && apt.image.length ? apt.image[0] : null)
      || "assets/apartments/apartment1.jpeg";
    const mainImage = resolveListingImageUrl(thumb);

    // Use translated title/location if available
    const title = (apt.titleTranslations && apt.titleTranslations[lang])
      || apt.title || '';
    const location = (apt.locationTranslations && apt.locationTranslations[lang])
      || apt.location || '';

    const floorText = apt.floor ? apt.floor + getOrdinalSuffix(apt.floor) + " floor" : "House";
    const furnishedText = apt.furnished ? "Furnished" : "Unfurnished";

    let viewText = "";
    if (Array.isArray(apt.view) && apt.view.length) {
      viewText = apt.view.map(function(v) { return capitalize(v); }).join(", ") + " View";
    }

    html += `
      <div class="apartment-card" data-apt-id="${apt.id}">
        <img src="${mainImage}" alt="${title}">
        <div class="apartment-info">
          <h3 class="apt-title">${title}</h3>
          <p class="location apt-location">${location}, Bulgaria</p>
          <p class="price">€${apt.price.toLocaleString()}</p>
          <p class="details">
            ${apt.area} m² · ${floorText} · ${furnishedText}${viewText ? ' · ' + viewText : ''}
          </p>
          <a href="pages/apartment-description.html?id=${apt.id}" class="btn btn-view">View Details</a>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
}

function capitalize(str) {
  const s = String(str);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getOrdinalSuffix(num) {
  const j = num % 10, k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

document.addEventListener("DOMContentLoaded", function() {
  loadApartments();

  const form = document.getElementById("filterForm");
  if (!form) return;

  form.addEventListener("change", filterApartments);

  let debounceTimer;
  form.querySelectorAll('input[type="number"]').forEach(function(input) {
    input.addEventListener("input", function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterApartments, 500);
    });
  });
});
