// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Import apartments data
const apartments = require('./data/apartment.json');

// GET all apartments
app.get('/api/apartments', (req, res) => {
  res.json(apartments);
});

// GET filtered apartments
app.get('/api/apartments/filter', (req, res) => {
  let filtered = [...apartments];
  
  const {
    propertyType,
    location,
    apartmentType,
    saleType,
    seaDistance,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    priceM2Min,
    priceM2Max,
    furnished,
    view,
    floor
  } = req.query;

  // Filter by property type
  if (propertyType) {
    filtered = filtered.filter(apt => apt.propertyType === propertyType);
  }

  // Filter by location
  if (location) {
    filtered = filtered.filter(apt => apt.location.toLowerCase() === location.toLowerCase());
  }

  // Filter by apartment type
  if (apartmentType) {
    filtered = filtered.filter(apt => apt.apartmentType === apartmentType);
  }

  // Filter by sale type
  if (saleType) {
    filtered = filtered.filter(apt => apt.saleType === saleType);
  }

  // Filter by distance to sea
  if (seaDistance) {
    filtered = filtered.filter(apt => apt.seaDistance === seaDistance);
  }

  // Filter by price range
  if (priceMin) {
    filtered = filtered.filter(apt => apt.price >= parseInt(priceMin));
  }
  if (priceMax) {
    filtered = filtered.filter(apt => apt.price <= parseInt(priceMax));
  }

  // Filter by area range
  if (areaMin) {
    filtered = filtered.filter(apt => apt.area >= parseInt(areaMin));
  }
  if (areaMax) {
    filtered = filtered.filter(apt => apt.area <= parseInt(areaMax));
  }

  // Filter by price per m2 range
  if (priceM2Min) {
    filtered = filtered.filter(apt => apt.pricePerM2 >= parseInt(priceM2Min));
  }
  if (priceM2Max) {
    filtered = filtered.filter(apt => apt.pricePerM2 <= parseInt(priceM2Max));
  }

  // Filter by furnished
  if (furnished) {
    const isFurnished = furnished === 'yes';
    filtered = filtered.filter(apt => apt.furnished === isFurnished);
  }

  // Filter by view (can be multiple)
  if (view) {
    const views = Array.isArray(view) ? view : [view];
    filtered = filtered.filter(apt => 
      views.some(v => apt.view.includes(v))
    );
  }

  // Filter by floor (can be multiple)
  if (floor) {
    const floors = Array.isArray(floor) ? floor : [floor];
    filtered = filtered.filter(apt => 
      floors.some(f => apt.floorType.includes(f))
    );
  }

  res.json(filtered);
});

// GET single apartment by ID
app.get('/api/apartments/:id', (req, res) => {
  const apartment = apartments.find(apt => apt.id === parseInt(req.params.id));
  
  if (!apartment) {
    return res.status(404).json({ error: 'Apartment not found' });
  }
  
  res.json(apartment);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Serving ${apartments.length} apartments`);
});