// js/app.js - Frontend JavaScript to connect with backend

const API_URL = 'http://localhost:3000/api';

// Load all apartments on page load
async function loadApartments() {
  try {
    const response = await fetch(`${API_URL}/apartments`);
    const apartments = await response.json();
    displayApartments(apartments);
    updateCount(apartments.length);
  } catch (error) {
    console.error('Error loading apartments:', error);
    showError();
  }
}

// Apply filters and fetch filtered apartments
async function filterApartments() {
  const form = document.getElementById('filterForm');
  const formData = new FormData(form);
  
  // Build query string
  const params = new URLSearchParams();
  
  for (let [key, value] of formData.entries()) {
    if (value) {
      params.append(key, value);
    }
  }
  
  // Handle checkboxes separately (view and floor)
  const viewCheckboxes = form.querySelectorAll('input[name="view"]:checked');
  viewCheckboxes.forEach(cb => params.append('view', cb.value));
  
  const floorCheckboxes = form.querySelectorAll('input[name="floor"]:checked');
  floorCheckboxes.forEach(cb => params.append('floor', cb.value));
  
  try {
    const response = await fetch(`${API_URL}/apartments/filter?${params.toString()}`);
    const apartments = await response.json();
    displayApartments(apartments);
    updateCount(apartments.length);
  } catch (error) {
    console.error('Error filtering apartments:', error);
    showError();
  }
}

// Display apartments in the grid
function displayApartments(apartments) {
  const grid = document.querySelector('.apartments-grid');
  
  if (apartments.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No apartments found matching your criteria. Try adjusting your filters.</p>';
    return;
  }
  
  grid.innerHTML = apartments.map(apt => `
    <div class="apartment-card">
      <img src="${apt.image}" alt="${apt.title}" onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'">
      <div class="apartment-info">
        <h3>${apt.title}</h3>
        <p class="location">${apt.location}, Bulgaria</p>
        <p class="price">€${apt.price.toLocaleString()}</p>
        <p class="details">
          ${apt.area} m² · ${apt.floor ? `${apt.floor}${getOrdinalSuffix(apt.floor)} floor` : 'House'} 
          · ${apt.furnished ? 'Furnished' : 'Unfurnished'} 
          · ${apt.view.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')} View
        </p>
        <a href="#" class="btn btn-view" onclick="viewApartment(${apt.id}); return false;">View Details</a>
      </div>
    </div>
  `).join('');
}

// Update apartment count
function updateCount(count) {
  const countElement = document.getElementById('apartmentCount');
  if (countElement) {
    countElement.textContent = count;
  }
}

// Show error message
function showError() {
  const grid = document.querySelector('.apartments-grid');
  grid.innerHTML = `
    <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
      ⚠️ Unable to load apartments. Make sure the backend server is running on http://localhost:3000
    </p>
  `;
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// View single apartment details
async function viewApartment(id) {
  try {
    const response = await fetch(`${API_URL}/apartments/${id}`);
    const apartment = await response.json();
    
    // Create a nice modal-style alert
    const details = `
📍 ${apartment.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: ${apartment.location}, Bulgaria
Price: €${apartment.price.toLocaleString()}
Area: ${apartment.area} m²
Price per m²: €${apartment.pricePerM2}/m²

${apartment.floor ? `Floor: ${apartment.floor}` : 'Property Type: House'}
Furnished: ${apartment.furnished ? 'Yes' : 'No'}
View: ${apartment.view.join(', ')}

${apartment.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact us to schedule a viewing!
    `;
    
    alert(details);
    // You can replace this with a proper modal later
  } catch (error) {
    console.error('Error loading apartment details:', error);
    alert('Unable to load apartment details. Please try again.');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadApartments();
  
  // Add real-time filtering
  const form = document.getElementById('filterForm');
  form.addEventListener('change', filterApartments);
  
  // Add input event for number fields (with debounce)
  let debounceTimer;
  const numberInputs = form.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterApartments, 500);
    });
  });
});