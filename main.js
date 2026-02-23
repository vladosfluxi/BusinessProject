const apartmentsGrid = document.getElementById("apartmentsGrid");

async function fetchApartments() {
  try {
    const res = await fetch("/api/apartments");
    const apartments = await res.json();

    apartmentsGrid.innerHTML = apartments
      .map((a) => {
        const img = Array.isArray(a.image) ? a.image[0] : a.image;

        return `
          <div class="apartment-card">
            <img src="${img}" alt="${a.title}">
            <div class="apartment-info">
              <h3>${a.title}</h3>
              <p class="location">${a.location}</p>
              <p class="price">€${a.price.toLocaleString()}</p>
              <p class="details">${a.area} m² · ${a.floor} floor · ${a.furnished} · ${a.view.join(", ")} View</p>
              <a href="pages/apartment-description.html?id=${a.id}" class="btn btn-view">View Details</a>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    apartmentsGrid.innerHTML = `<p>Error loading apartments</p>`;
    console.error(err);
  }
}

fetchApartments();
