// main.js

const apartmentsGrid = document.getElementById('apartmentsGrid');

async function fetchApartments() {
  try {
    const res = await fetch('http://localhost:5000/api/apartments');
    const apartments = await res.json();
    apartmentsGrid.innerHTML = apartments.map(a => `
      <div class="apartment-card">
        <img src="${a.image}" alt="${a.title}">
        <div class="apartment-info">
          <h3>${a.title}</h3>
          <p class="location">${a.location}</p>
          <p class="price">€${a.price.toLocaleString()}</p>
          <p class="details">${a.area} m² · ${a.floor} floor · ${a.furnished} · ${a.view.join(', ')} View</p>
          <a href="#" class="btn btn-view">View Details</a>
        </div>
      </div>
    `).join('');
  } catch(err) {
    apartmentsGrid.innerHTML = `<p>Error loading apartments</p>`;
    console.error(err);
  }
}

fetchApartments();
