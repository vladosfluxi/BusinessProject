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
  // Use images from apartment data, or fall back to demo images
  let images = [
    'assets/apartments/apartment1.jpeg',
    'assets/apartments/apartment2.jpeg',
    'assets/apartments/apartment3.jpeg'
  ];
  
  // If apt has images, use those instead
  if (apt.image && Array.isArray(apt.image)) {
    images = apt.image;
  }
  
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

  // Initialize lightbox with the images (after thumbnails are created)
  setTimeout(() => {
    initLightbox(images);
  }, 100);
  
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

// ====== LIGHTBOX FUNCTIONALITY ======
let lightboxState = {
  currentIndex: 0,
  images: [],
  zoomLevel: 2, // Start at 200% (2x) by default
  maxZoom: 4,   // Max zoom: 400% (4x)
  minZoom: 1    // Min zoom: 100% (1x)
};

function initLightbox(images) {
  console.log('Initializing lightbox with images:', images);
  lightboxState.images = images;
  lightboxState.currentIndex = 0;
  lightboxState.zoomLevel = 1;

  const modal = document.getElementById('lightbox-modal');
  if (!modal) {
    console.error('Lightbox modal not found in DOM');
    return;
  }

  const totalSpan = document.getElementById('lightbox-total');
  if (totalSpan) {
    totalSpan.textContent = images.length;
  }

  // Click on main image to open lightbox
  const mainImg = document.querySelector('.main-img');
  if (mainImg) {
    // Remove any existing listeners first
    const newMainImg = mainImg.cloneNode(true);
    mainImg.parentNode.replaceChild(newMainImg, mainImg);
    
    const refreshedMainImg = document.querySelector('.main-img');
    refreshedMainImg.addEventListener('click', (e) => {
      console.log('Main image clicked');
      lightboxState.currentIndex = 0;
      openLightbox();
    });
    refreshedMainImg.style.cursor = 'pointer';
  }

  // Click on thumbnails to open lightbox
  const thumbnails = document.querySelectorAll('.thumbnail-img');
  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', (e) => {
      console.log('Thumbnail clicked:', index);
      e.stopPropagation();
      lightboxState.currentIndex = index;
      openLightbox();
    });
    thumb.style.cursor = 'pointer';
  });

  // Setup modal controls - Top close button
  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  // Setup modal controls - Bottom close button
  const closeBottomBtn = document.getElementById('lightbox-close-bottom');
  if (closeBottomBtn) {
    closeBottomBtn.addEventListener('click', closeLightbox);
  }

  // Click outside image to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeLightbox();
    }
  });

  // Arrow navigation
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  if (prevBtn) prevBtn.addEventListener('click', prevImage);
  if (nextBtn) nextBtn.addEventListener('click', nextImage);

  // Zoom controls
  const zoomInBtn = document.getElementById('lightbox-zoom-in');
  const zoomOutBtn = document.getElementById('lightbox-zoom-out');
  const resetZoomBtn = document.getElementById('lightbox-reset-zoom');
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (resetZoomBtn) resetZoomBtn.addEventListener('click', resetZoom);

  // Keyboard support
  document.addEventListener('keydown', handleKeyboard);
  
  console.log('Lightbox initialized successfully');
}

function openLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('active');
  lightboxState.zoomLevel = 3; // Start at 200% (2x) by default
  updateLightboxImage();
  
  // Prevent scrolling on body when lightbox is open
  document.body.style.overflow = 'hidden';
  
  // Add mouse wheel zoom support
  const lightboxImage = document.getElementById('lightbox-image');
  if (lightboxImage) {
    lightboxImage.addEventListener('wheel', handleMouseWheel);
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.remove('active');
  resetZoom(); // Reset zoom when closing
  
  // Restore scrolling on body
  document.body.style.overflow = 'auto';
  
  // Remove mouse wheel listener
  const lightboxImage = document.getElementById('lightbox-image');
  if (lightboxImage) {
    lightboxImage.removeEventListener('wheel', handleMouseWheel);
  }
}

function updateLightboxImage() {
  const lightboxImage = document.getElementById('lightbox-image');
  const currentSpan = document.getElementById('lightbox-current');
  const img = lightboxState.images[lightboxState.currentIndex];

  const resolvedUrl = resolveDetailsImageUrl(img);
  lightboxImage.src = resolvedUrl;
  lightboxImage.style.transform = `scale(${lightboxState.zoomLevel})`;

  currentSpan.textContent = lightboxState.currentIndex + 1;
}

function prevImage() {
  lightboxState.currentIndex = (lightboxState.currentIndex - 1 + lightboxState.images.length) % lightboxState.images.length;
  lightboxState.zoomLevel = 3; // Reset zoom to 200% (2x) on image change
  updateLightboxImage();
}

function nextImage() {
  lightboxState.currentIndex = (lightboxState.currentIndex + 1) % lightboxState.images.length;
  lightboxState.zoomLevel = 3; // Reset zoom to 200% (2x) on image change
  updateLightboxImage();
}

function zoomIn() {
  if (lightboxState.zoomLevel < lightboxState.maxZoom) {
    lightboxState.zoomLevel += 0.2;
    updateLightboxImage();
  }
}

function zoomOut() {
  if (lightboxState.zoomLevel > lightboxState.minZoom) {
    lightboxState.zoomLevel -= 0.2;
    updateLightboxImage();
  }
}

function resetZoom() {
  lightboxState.zoomLevel = 2; // Reset to 200% (2x) default
  const lightboxImage = document.getElementById('lightbox-image');
  if (lightboxImage) {
    lightboxImage.style.transform = `scale(${lightboxState.zoomLevel})`;
  }
}

function handleMouseWheel(e) {
  e.preventDefault();
  
  // Zoom in on scroll up, zoom out on scroll down
  if (e.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

function handleKeyboard(e) {
  const modal = document.getElementById('lightbox-modal');
  if (!modal.classList.contains('active')) return;

  switch (e.key) {
    case 'ArrowLeft':
      prevImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
    case 'Escape':
      closeLightbox();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
    case '_':
      zoomOut();
      break;
  }
}

// Load apartment details when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadApartmentDetails();
});