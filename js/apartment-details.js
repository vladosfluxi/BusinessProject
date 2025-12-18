// js/apartment-details.js - Load dynamic apartment details

const API_URL = 'http://localhost:3000/api';

// Get apartment ID from URL
function getApartmentIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load apartment details
async function loadApartmentDetails() {
  const apartmentId = getApartmentIdFromURL();
  
  if (!apartmentId) {
    showError('No apartment ID provided');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/apartments/${apartmentId}`);
    
    if (!response.ok) {
      throw new Error('Apartment not found');
    }
    
    const apartment = await response.json();
    displayApartmentDetails(apartment);
  } catch (error) {
    console.error('Error loading apartment:', error);
    showError('Unable to load apartment details. Please try again.');
  }
}

// Display apartment details
function displayApartmentDetails(apt) {
  // Update page title
  document.title = `${apt.title} - Real Estate Bulgaria`;
  
  // Update main image and thumbnails
  const mainImg = document.querySelector('.main-img');
  if (mainImg) {
    mainImg.src = apt.image[1];
    mainImg.alt = apt.title;
  }
  
  // Update thumbnails (using same image for demo)
  const thumbnails = document.querySelectorAll('.thumbnails img');
  thumbnails.forEach(thumb => {
    thumb.src = apt.image;
    thumb.alt = apt.title;
  });
  
  // Update apartment title
  const titleElement = document.querySelector('.apartment-details h2');
  if (titleElement) {
    titleElement.textContent = apt.title;
  }
  
  // Update price
  const priceElement = document.querySelector('.apartment-details .price');
  if (priceElement) {
    priceElement.textContent = `€ ${apt.price.toLocaleString()}`;
  }
  
  // Update details
  const detailsSection = document.querySelector('.apartment-details');
  if (detailsSection) {
    // Find or create detail paragraphs
    const locationP = detailsSection.querySelector('p:nth-of-type(2)') || document.createElement('p');
    const areaP = detailsSection.querySelector('p:nth-of-type(3)') || document.createElement('p');
    const floorP = detailsSection.querySelector('p:nth-of-type(4)') || document.createElement('p');
    const furnishedP = detailsSection.querySelector('p:nth-of-type(5)') || document.createElement('p');
    const viewP = detailsSection.querySelector('p:nth-of-type(6)') || document.createElement('p');
    
    locationP.innerHTML = `<strong>Location:</strong> ${apt.location}, Bulgaria`;
    areaP.innerHTML = `<strong>Area:</strong> ${apt.area} m²`;
    
    if (apt.floor) {
      floorP.innerHTML = `<strong>Floor:</strong> ${apt.floor}${getOrdinalSuffix(apt.floor)} Floor`;
    } else {
      floorP.innerHTML = `<strong>Property Type:</strong> House`;
    }
    
    furnishedP.innerHTML = `<strong>Furnished:</strong> ${apt.furnished ? 'Yes' : 'No'}`;
    viewP.innerHTML = `<strong>View:</strong> ${apt.view.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')}`;
  }
  
  // Update description
  const descriptionP = document.querySelector('.apartment-details h3 + p');
  if (descriptionP) {
    descriptionP.textContent = apt.description;
  }
  
  // Update key features
  const featuresList = document.querySelector('.apartment-details ul');
  if (featuresList) {
    featuresList.innerHTML = `
      <li>${apt.apartmentType ? apt.apartmentType.replace('room', ' Room') : 'Multi-room'} ${apt.propertyType}</li>
      <li>Area: ${apt.area} m²</li>
      <li>Price per m²: €${apt.pricePerM2}</li>
      <li>${apt.furnished ? 'Fully Furnished' : 'Unfurnished'}</li>
      <li>Sale Type: ${apt.saleType === 'secondary' ? 'Resale' : 'From Investor'}</li>
      ${apt.seaDistance ? `<li>Distance to Sea: ${apt.seaDistance} meters</li>` : ''}
      <li>${apt.view.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')} View</li>
    `;
  }
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

// Show error message
function showError(message) {
  const container = document.querySelector('.description-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h2 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Error</h2>
        <p style="color: #666; font-size: 18px; margin-bottom: 30px;">${message}</p>
        <a href="../index.html" class="contact-btn" style="display: inline-block; text-decoration: none;">
          ← Back to Listings
        </a>
      </div>
    `;
  }
}

// Load apartment details when page loads
document.addEventListener('DOMContentLoaded', loadApartmentDetails);