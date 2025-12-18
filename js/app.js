const API_URL = 'http://localhost:3000/api'; // Make sure your backend is running here

// Load all apartments on page load
async function loadApartments() {
    const grid = document.querySelector('.apartments-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/apartments`);
        const apartments = await response.json();
        displayApartments(apartments);
    } catch (error) {
        console.error('Error loading apartments:', error);
        grid.innerHTML = `
            <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
                ⚠️ Unable to load apartments. Make sure the backend server is running on http://localhost:3000
            </p>
        `;
    }
}

// Apply filters and fetch filtered apartments
async function filterApartments() {
    const form = document.getElementById('filterForm');
    if (!form) return;

    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (let [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }

    // Handle checkboxes (view and floor)
    const viewCheckboxes = form.querySelectorAll('input[name="view"]:checked');
    viewCheckboxes.forEach(cb => params.append('view', cb.value));

    const floorCheckboxes = form.querySelectorAll('input[name="floor"]:checked');
    floorCheckboxes.forEach(cb => params.append('floor', cb.value));

    try {
        const response = await fetch(`${API_URL}/apartments/filter?${params.toString()}`);
        const apartments = await response.json();
        displayApartments(apartments);
    } catch (error) {
        console.error('Error filtering apartments:', error);
        const grid = document.querySelector('.apartments-grid');
        grid.innerHTML = `
            <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
                ⚠️ Unable to filter apartments. Check your backend.
            </p>
        `;
    }
}

// Display apartments in grid
function displayApartments(apartments) {
    const grid = document.querySelector('.apartments-grid');
    if (!grid) return;

    if (!apartments || apartments.length === 0) {
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
                    · ${apt.view.map(v => capitalize(v)).join(', ')} View
                </p>
                <a href="pages/apartment-description.html?id=${apt.id}" class="btn btn-view">View Details</a>
            </div>
        </div>
    `).join('');
}

// Helper: Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper: Ordinal suffix for floor
function getOrdinalSuffix(num) {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadApartments();

    const form = document.getElementById('filterForm');
    if (!form) return;

    form.addEventListener('change', filterApartments);

    // Debounce for number inputs
    let debounceTimer;
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterApartments, 500);
        });
    });
});
