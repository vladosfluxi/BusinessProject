const filterForm = document.getElementById("filterForm");

// Function to get all selected filters
function getFilters() {
  const filters = {};

  // Dropdowns & select elements
  const selects = filterForm.querySelectorAll("select");
  selects.forEach(select => {
    filters[select.name] = select.value;
  });

  // Range inputs (price, area, price per m²)
  filters.priceMin = document.getElementById("priceMin").value;
  filters.priceMax = document.getElementById("priceMax").value;
  filters.areaMin = document.getElementById("areaMin").value;
  filters.areaMax = document.getElementById("areaMax").value;
  filters.priceM2Min = document.getElementById("priceM2Min").value;
  filters.priceM2Max = document.getElementById("priceM2Max").value;

  // Checkboxes (View and Floor)
  const checkboxGroups = ["view", "floor"];
  checkboxGroups.forEach(groupName => {
    const checkedBoxes = filterForm.querySelectorAll(`input[name="${groupName}"]:checked`);
    filters[groupName] = Array.from(checkedBoxes).map(cb => cb.value);
  });

  return filters;
}

// Listen for changes on the entire form
filterForm.addEventListener("change", () => {
  const filters = getFilters();
  console.log("Filters updated:", filters);

  // TODO: Use these filters to update apartment listings dynamically
});