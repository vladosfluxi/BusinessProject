// js/apartment-details.js

const API_URL = '/api';

function getApartmentIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadApartmentDetails() {
  const apartmentId = getApartmentIdFromURL();
  if (!apartmentId) { showError('No apartment ID provided'); return; }

  try {
    const response = await fetch(`${API_URL}/apartments/${apartmentId}`);
    if (!response.ok) throw new Error('Apartment not found');

    let apartment = await response.json();

    if (!apartment.image) {
      apartment.image = [
        '../assets/apartments/apartment1.jpeg',
        '../assets/apartments/apartment2.jpeg',
        '../assets/apartments/apartment3.jpeg'
      ];
    } else if (!Array.isArray(apartment.image)) {
      apartment.image = [apartment.image];
    }

    // Store globally so switchLanguage() can re-render on language change
    window.__currentApartment = apartment;

    displayApartmentDetails(apartment);

    // Apply translations for the currently selected language
    const lang = window.currentLang || localStorage.getItem('selectedLanguage') || 'en';
    if (typeof applyApartmentTranslations === 'function') {
      applyApartmentTranslations(lang);
    }
  } catch (error) {
    console.error('Error loading apartment:', error);
    showError('Unable to load apartment details. Please try again.');
  }
}

function resolveDetailsImageUrl(path) {
  if (!path) return '../assets/apartments/apartment1.jpeg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleaned = path.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
  if (cleaned.startsWith('assets/')) return `../${cleaned}`;
  return `../assets/apartments/${cleaned}`;
}

function displayApartmentDetails(apt) {
  const images = (apt.image && Array.isArray(apt.image) && apt.image.length)
    ? apt.image
    : ['assets/apartments/apartment1.jpeg'];

  const mainImageSrc = resolveDetailsImageUrl(images[0]);

  // Page title (English fallback — applyApartmentTranslations will update it)
  document.title = `${apt.title} - Real Estate Bulgaria`;

  // Main image
  const mainImg = document.querySelector('.main-img');
  if (mainImg) {
    mainImg.src = mainImageSrc;
    mainImg.alt = apt.title;
    mainImg.addEventListener('error', () => {
      mainImg.src = '../assets/apartments/apartment1.jpeg';
    });
  }

  // Thumbnails
  const thumbnailsContainer = document.querySelector('.thumbnails');
  if (thumbnailsContainer) {
    thumbnailsContainer.innerHTML = '';
    images.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      const resolvedUrl = resolveDetailsImageUrl(imgUrl);
      thumb.src = resolvedUrl;
      thumb.alt = `${apt.title} image ${index + 1}`;
      thumb.className = 'thumbnail-img';
      thumb.style.border = index === 0 ? '2px solid #007bff' : '2px solid transparent';
      thumb.style.opacity = index === 0 ? '1' : '0.8';

      thumb.addEventListener('click', () => {
        if (mainImg) { mainImg.src = resolvedUrl; }
        thumbnailsContainer.querySelectorAll('.thumbnail-img').forEach((t, i) => {
          t.style.border = i === index ? '2px solid #007bff' : '2px solid transparent';
          t.style.opacity = i === index ? '1' : '0.8';
        });
      });
      thumb.addEventListener('error', () => { thumb.style.display = 'none'; });
      thumbnailsContainer.appendChild(thumb);
    });
  }

  // Lightbox
  setTimeout(() => { initLightbox(images); }, 100);

  // Populate the static fields that don't change with language
  const priceElement = document.querySelector('.apartment-details .price');
  if (priceElement) priceElement.textContent = `€ ${apt.price.toLocaleString()}`;

  // NOTE: title, location, description, floor, furnished, view, features
  // are all populated by applyApartmentTranslations() which is called right after
  // this function, and again on every language switch.
}

function getOrdinalSuffix(num) {
  const j = num % 10, k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function showError(message) {
  const container = document.querySelector('.description-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <h2 style="color:#e74c3c;margin-bottom:20px;">⚠️ Error</h2>
        <p style="color:#666;font-size:18px;margin-bottom:30px;">${message}</p>
        <a href="../index.html" class="contact-btn" style="display:inline-block;text-decoration:none;">← Back to Listings</a>
      </div>`;
  }
}

// ====== LIGHTBOX ======
let lightboxState = {
  currentIndex: 0, images: [],
  zoomLevel: 1, maxZoom: 4, minZoom: 1
};

function initLightbox(images) {
  lightboxState.images = images;
  lightboxState.currentIndex = 0;
  lightboxState.zoomLevel = 1;

  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  const totalSpan = document.getElementById('lightbox-total');
  if (totalSpan) totalSpan.textContent = images.length;

  const mainImg = document.querySelector('.main-img');
  if (mainImg) {
    const newMainImg = mainImg.cloneNode(true);
    mainImg.parentNode.replaceChild(newMainImg, mainImg);
    const refreshed = document.querySelector('.main-img');
    refreshed.addEventListener('click', () => { lightboxState.currentIndex = 0; openLightbox(); });
    refreshed.style.cursor = 'pointer';
  }

  document.querySelectorAll('.thumbnail-img').forEach((thumb, index) => {
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxState.currentIndex = index;
      openLightbox();
    });
    thumb.style.cursor = 'pointer';
  });

  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  const closeBottomBtn = document.getElementById('lightbox-close-bottom');
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeLightbox);

  modal.addEventListener('click', (e) => { if (e.target === modal) closeLightbox(); });

  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  if (prevBtn) prevBtn.addEventListener('click', prevImage);
  if (nextBtn) nextBtn.addEventListener('click', nextImage);

  const zoomInBtn = document.getElementById('lightbox-zoom-in');
  const zoomOutBtn = document.getElementById('lightbox-zoom-out');
  const resetZoomBtn = document.getElementById('lightbox-reset-zoom');
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (resetZoomBtn) resetZoomBtn.addEventListener('click', resetZoom);

  document.addEventListener('keydown', handleKeyboard);
}

function openLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('active');
  lightboxState.zoomLevel = 1;
  updateLightboxImage();
  document.body.style.overflow = 'hidden';
  const img = document.getElementById('lightbox-image');
  if (img) img.addEventListener('wheel', handleMouseWheel);
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.remove('active');
  resetZoom();
  document.body.style.overflow = 'auto';
  const img = document.getElementById('lightbox-image');
  if (img) img.removeEventListener('wheel', handleMouseWheel);
}

function updateLightboxImage() {
  const img = document.getElementById('lightbox-image');
  const currentSpan = document.getElementById('lightbox-current');
  const src = lightboxState.images[lightboxState.currentIndex];
  img.src = resolveDetailsImageUrl(src);
  img.style.transform = `scale(${lightboxState.zoomLevel})`;
  currentSpan.textContent = lightboxState.currentIndex + 1;
}

function prevImage() {
  lightboxState.currentIndex = (lightboxState.currentIndex - 1 + lightboxState.images.length) % lightboxState.images.length;
  lightboxState.zoomLevel = 1;
  updateLightboxImage();
}

function nextImage() {
  lightboxState.currentIndex = (lightboxState.currentIndex + 1) % lightboxState.images.length;
  lightboxState.zoomLevel = 1;
  updateLightboxImage();
}

function zoomIn() {
  if (lightboxState.zoomLevel < lightboxState.maxZoom) { lightboxState.zoomLevel += 0.2; updateLightboxImage(); }
}
function zoomOut() {
  if (lightboxState.zoomLevel > lightboxState.minZoom) { lightboxState.zoomLevel -= 0.2; updateLightboxImage(); }
}
function resetZoom() {
  lightboxState.zoomLevel = 1;
  const img = document.getElementById('lightbox-image');
  if (img) img.style.transform = 'scale(1)';
}
function handleMouseWheel(e) {
  e.preventDefault();
  e.deltaY < 0 ? zoomIn() : zoomOut();
}
function handleKeyboard(e) {
  const modal = document.getElementById('lightbox-modal');
  if (!modal.classList.contains('active')) return;
  switch (e.key) {
    case 'ArrowLeft': prevImage(); break;
    case 'ArrowRight': nextImage(); break;
    case 'Escape': closeLightbox(); break;
    case '+': case '=': zoomIn(); break;
    case '-': case '_': zoomOut(); break;
  }
}

document.addEventListener('DOMContentLoaded', () => { loadApartmentDetails(); });
