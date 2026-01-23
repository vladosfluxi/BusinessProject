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
    // 1) Load base apartment data from backend
    const response = await fetch(`${API_URL}/apartments/${apartmentId}`);
    
    if (!response.ok) {
      throw new Error('Apartment not found');
    }
    
    let apartment = await response.json();

    // 2) Ensure we always have an array of images
    //    We no longer fetch ../data/apartment.json because browsers block
    //    file:// → file:// fetches. Instead, we fall back to our three local images.
    if (!apartment.image) {
      apartment.image = [
        'assets/apartments/apartment1.jpeg',
        'assets/apartments/apartment2.jpeg',
        'assets/apartments/apartment3.jpeg'
      ];
    } else if (!Array.isArray(apartment.image)) {
      apartment.image = [apartment.image];
    }

    displayApartmentDetails(apartment);
  } catch (error) {
    console.error('Error loading apartment:', error);
    showError('Unable to load apartment details. Please try again.');
  }
}

// Helper: Normalize image URL for details page (in /pages/)
function resolveDetailsImageUrl(path) {
  if (!path) return '../assets/apartments/apartment1.jpeg';

  // Keep absolute / remote URLs as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Strip any leading ../ or / so we can prepend ../ consistently
  const cleaned = path.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');

  // If it already starts with assets/, prepend ../
  if (cleaned.startsWith('assets/')) {
    return `../${cleaned}`;
  }

  // Otherwise assume it's a bare filename and prepend ../assets/
  return `../assets/${cleaned}`;
}

// Display apartment details
function displayApartmentDetails(apt) {
  // For now, always use the three local demo images on the details page,
  // so that images reliably show even when backend data / file fetch is blocked.
  const images = [
    'assets/apartments/apartment1.jpeg',
    'assets/apartments/apartment2.jpeg',
    'assets/apartments/apartment3.jpeg'
  ];
  
  const mainImageSrc = resolveDetailsImageUrl(images[0]);

  // Update page title
  document.title = `${apt.title} - Real Estate Bulgaria`;
  
  // Update main image and thumbnails
  const mainImg = document.querySelector('.main-img');
  if (mainImg) {
    mainImg.src = mainImageSrc;
    mainImg.alt = apt.title;
    
    // Add error handling for main image
    mainImg.addEventListener('error', () => {
      console.warn(`Failed to load main image: ${mainImageSrc}`);
      mainImg.src = '../assets/apartments/apartment1.jpeg'; // Fallback
    });
  }
  
  // Update thumbnails dynamically based on image array
  const thumbnailsContainer = document.querySelector('.thumbnails');
  if (thumbnailsContainer) {
    thumbnailsContainer.innerHTML = '';

    images.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      const resolvedUrl = resolveDetailsImageUrl(imgUrl);
      thumb.src = resolvedUrl;
      thumb.alt = `${apt.title} image ${index + 1}`;
      thumb.className = 'thumbnail-img';
      
      // Highlight first thumbnail as active
      if (index === 0) {
        thumb.style.border = '2px solid #007bff';
        thumb.style.opacity = '1';
      } else {
        thumb.style.border = '2px solid transparent';
        thumb.style.opacity = '0.8';
      }

      // Clicking a thumbnail updates the main image
      thumb.addEventListener('click', () => {
        if (mainImg) {
          mainImg.src = resolvedUrl;
          mainImg.alt = `${apt.title} image ${index + 1}`;
        }
        
        // Update active thumbnail styling
        thumbnailsContainer.querySelectorAll('.thumbnail-img').forEach((t, i) => {
          if (i === index) {
            t.style.border = '2px solid #007bff';
            t.style.opacity = '1';
          } else {
            t.style.border = '2px solid transparent';
            t.style.opacity = '0.8';
          }
        });
      });

      // Add error handling for broken images
      thumb.addEventListener('error', () => {
        console.warn(`Failed to load thumbnail image: ${resolvedUrl}`);
        thumb.style.display = 'none';
      });

      thumbnailsContainer.appendChild(thumb);
    });
    
    console.log(`Created ${images.length} thumbnail(s) for apartment ${apt.id}`);
  } else {
    console.error('Thumbnails container not found in DOM');
  }
  
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