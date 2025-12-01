// 1️⃣ Import dependencies
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// 2️⃣ Initialize Express
const app = express();
const PORT = 5000;

// 3️⃣ Middleware
app.use(cors()); // Allow frontend to access backend
app.use(express.json()); // Parse JSON body

// 4️⃣ Load apartments from JSON
const apartmentsFile = path.join(__dirname, "apartments.json");

function getApartments() {
  const data = fs.readFileSync(apartmentsFile, "utf8");
  return JSON.parse(data);
}

// 5️⃣ Routes

// Test route
app.get("/", (req, res) => {
  res.send("RealEstate backend is running");
});

// Filter route
app.post("/filter", (req, res) => {
  const filters = req.body;
  const apartments = getApartments();

  const filtered = apartments.filter(apartment => {
    // Property Type
    if (filters.propertyType && apartment.type !== filters.propertyType) return false;

    // Location
    if (filters.location && apartment.location.toLowerCase() !== filters.location.toLowerCase()) return false;

    // Sale Type
    if (filters.saleType && apartment.saleType !== filters.saleType) return false;

    // Furnished
    if (filters.furnished) {
      if (filters.furnished === "yes" && !apartment.furnished) return false;
      if (filters.furnished === "no" && apartment.furnished) return false;
    }

    // Views
    if (filters.view && filters.view.length > 0) {
      if (!filters.view.some(v => apartment.views.includes(v))) return false;
    }

    // Floor
    if (filters.floor && filters.floor.length > 0) {
      if (!filters.floor.includes(apartment.floor.toLowerCase())) return false;
    }

    // Price
    if (filters.priceMin && apartment.price < filters.priceMin) return false;
    if (filters.priceMax && apartment.price > filters.priceMax) return false;

    // Area
    if (filters.areaMin && apartment.area < filters.areaMin) return false;
    if (filters.areaMax && apartment.area > filters.areaMax) return false;

    // Price per m2
    if (filters.priceM2Min && apartment.priceM2 < filters.priceM2Min) return false;
    if (filters.priceM2Max && apartment.priceM2 > filters.priceM2Max) return false;

    // Distance to sea
    if (filters.seaDistance) {
      const dist = apartment.distanceToSea;
      switch (filters.seaDistance) {
        case "0-100":
          if (dist > 100) return false;
          break;
        case "100-500":
          if (dist < 100 || dist > 500) return false;
          break;
        case "500-1000":
          if (dist < 500 || dist > 1000) return false;
          break;
        case "1000+":
          if (dist < 1000) return false;
          break;
      }
    }

    return true;
  });

  res.json(filtered);
});

// 6️⃣ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
