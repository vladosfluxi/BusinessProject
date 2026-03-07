// js/app.js - FIXED (compatible syntax)
// Uses:
// - apt.thumbnail (from backend) for listing card image
// - falls back to apt.image[0] then a local fallback

const API_URL = "/api";

function loadApartments() {
  const grid = document.querySelector(".apartments-grid");
  if (!grid) return;

  fetch(API_URL + "/apartments")
    .then(function(response) {
      return response.json();
    })
    .then(function(apartments) {
      displayApartments(apartments);
    })
    .catch(function(error) {
      console.error("Error loading apartments:", error);
      grid.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          ⚠️ Unable to load apartments. Make sure the backend server is running on http://localhost:3000
        </p>
      `;
    });
}

function filterApartments() {
  const form = document.getElementById("filterForm");
  if (!form) return;

  const formData = new FormData(form);
  const params = new URLSearchParams();

  for (let entry of formData.entries()) {
    const key = entry[0];
    const value = entry[1];
    if (value) params.append(key, value);
  }

  const viewCheckboxes = form.querySelectorAll('input[name="view"]:checked');
  for (let i = 0; i < viewCheckboxes.length; i++) {
    params.append("view", viewCheckboxes[i].value);
  }

  const floorCheckboxes = form.querySelectorAll('input[name="floor"]:checked');
  for (let i = 0; i < floorCheckboxes.length; i++) {
    params.append("floor", floorCheckboxes[i].value);
  }

  fetch(API_URL + "/apartments/filter?" + params.toString())
    .then(function(response) {
      return response.json();
    })
    .then(function(apartments) {
      displayApartments(apartments);
    })
    .catch(function(error) {
      console.error("Error filtering apartments:", error);
      const grid = document.querySelector(".apartments-grid");
      if (grid) {
        grid.innerHTML = `
          <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
            ⚠️ Unable to filter apartments. Check your backend.
          </p>
        `;
      }
    });
}

function resolveListingImageUrl(path) {
  if (!path) return "assets/apartments/apartment1.jpeg";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleaned = path.replace(/^(\.\.\/)+/, "").replace(/^\/+/, "");

  if (cleaned.startsWith("assets/")) {
    return cleaned;
  }

  return "assets/" + cleaned;
}

function displayApartments(apartments) {
  const grid = document.querySelector(".apartments-grid");
  if (!grid) return;

  if (!apartments || apartments.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No apartments found matching your criteria. Try adjusting your filters.</p>';
    return;
  }

  let html = "";
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    
    const thumb =
      apt.thumbnail ||
      (Array.isArray(apt.image) && apt.image.length ? apt.image[0] : null) ||
      "assets/apartments/apartment1.jpeg";

    const mainImage = resolveListingImageUrl(thumb);

    const floorText = apt.floor ? apt.floor + getOrdinalSuffix(apt.floor) + " floor" : "House";
    const furnishedText = apt.furnished ? "Furnished" : "Unfurnished";
    
    let viewText = "";
    if (Array.isArray(apt.view)) {
      const views = [];
      for (let j = 0; j < apt.view.length; j++) {
        views.push(capitalize(apt.view[j]));
      }
      viewText = views.join(", ") + " View";
    } else {
      viewText = "View";
    }

    html += `
      <div class="apartment-card">
        <img src="${mainImage}" alt="${apt.title}">
        <div class="apartment-info">
          <h3>${apt.title}</h3>
          <p class="location">${apt.location}, Bulgaria</p>
          <p class="price">€${apt.price.toLocaleString()}</p>
          <p class="details">
            ${apt.area} m² · ${floorText}
            · ${furnishedText}
            · ${viewText}
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
  const j = num % 10;
  const k = num % 100;
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
  const numberInputs = form.querySelectorAll('input[type="number"]');
  
  for (let i = 0; i < numberInputs.length; i++) {
    numberInputs[i].addEventListener("input", function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        filterApartments();
      }, 500);
    });
  }
});
