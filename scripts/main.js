const filterForm = document.getElementById("filterForm");
const apartmentsGrid = document.querySelector(".apartments-grid");

// Helper function: get all filters from form
function getFilters() {
  const filters = {};

  // Dropdowns
  const selects = filterForm.querySelectorAll("select");
  selects.forEach(select => {
    filters[select.name] = select.value;
  });

  // Range inputs
  filters.priceMin = Number(document.getElementById("priceMin").value) || 0;
  filters.priceMax = Number(document.getElementById("priceMax").value) || Infinity;
  filters.areaMin = Number(document.getElementById("areaMin").value) || 0;
  filters.areaMax = Number(document.getElementById("areaMax").value) || Infinity;
  filters.priceM2Min = Number(document.getElementById("priceM2Min").value) || 0;
  filters.priceM2Max = Number(document.getElementById("priceM2Max").value) || Infinity;

  // Checkboxes (view & floor)
  ["view", "floor"].forEach(name => {
    const checked = Array.from(filterForm.querySelectorAll(`input[name="${name}"]:checked`));
    filters[name] = checked.map(cb => cb.value);
  });

  return filters;
}

// Render apartments dynamically
function renderApartments(apartments) {
  apartmentsGrid.innerHTML = "";

  if (apartments.length === 0) {
    apartmentsGrid.innerHTML = "<p>No apartments found.</p>";
    return;
  }

  apartments.forEach(apartment => {
    const card = document.createElement("div");
    card.className = "apartment-card";
    card.innerHTML = `
      <img src="assets/apartments/${apartment.id}.jpg" alt="${apartment.title}">
      <div class="apartment-info">
        <h3>${apartment.title}</h3>
        <p class="location">${apartment.location}</p>
        <p class="price">€${apartment.price.toLocaleString()}</p>
        <p class="details">${apartment.area} m² · ${apartment.floor} · ${apartment.furnished ? "Furnished" : "Unfurnished"} · ${apartment.views.join(", ")}</p>
      </div>
    `;
    apartmentsGrid.appendChild(card);
  });
}

// Fetch apartments from backend
async function fetchApartments(filters) {
  try {
    const res = await fetch("http://localhost:5000/filter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    const data = await res.json();
    renderApartments(data);
  } catch (err) {
    console.error("Error fetching apartments:", err);
  }
}

// Listen for any change in the form
filterForm.addEventListener("change", () => {
  const filters = getFilters();
  fetchApartments(filters);
});

// Optional: fetch all apartments on page load
fetchApartments(getFilters());
