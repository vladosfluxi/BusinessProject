// server.js (Option B + dynamic thumbnail)
// - apartment.json stores: assetsDir (e.g. "/assets/apartments/offer-7")
// - backend returns:
//    image: [ ...all images in folder... ]   (thumbnail.jpeg is EXCLUDED from gallery)
//    thumbnail: "/assets/.../thumbnail.jpeg" if exists, else first gallery image, else fallback

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve everything static (including /assets)
app.use(express.static(__dirname));

// ---- Helpers ----

const DATA_PATH = path.join(__dirname, "data", "apartment.json");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// Preferred thumbnail filenames (in order)
const THUMBNAIL_NAMES = ["thumbnail.jpeg", "thumbnail.jpg", "thumbnail.png", "thumbnail.webp"];

function readApartmentsFresh() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function assetsDirToFsPath(assetsDir) {
  if (!assetsDir || typeof assetsDir !== "string") return null;

  // Convert URL path -> filesystem path
  // "/assets/apartments/offer-7" -> "<project>/assets/apartments/offer-7"
  const relative = assetsDir.replace(/^\/+/, "");
  const folderFsPath = path.join(__dirname, relative);

  if (!fs.existsSync(folderFsPath) || !fs.statSync(folderFsPath).isDirectory()) {
    return null;
  }
  return folderFsPath;
}

function findThumbnailUrl(assetsDir) {
  const folderFsPath = assetsDirToFsPath(assetsDir);
  if (!folderFsPath) return null;

  for (const name of THUMBNAIL_NAMES) {
    const full = path.join(folderFsPath, name);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return `${assetsDir.replace(/\/+$/, "")}/${name}`;
    }
  }
  return null;
}

function listGalleryImagesForAssetsDir(assetsDir) {
  // Gallery images exclude thumbnail.* so the details page doesn't show it twice.
  const folderFsPath = assetsDirToFsPath(assetsDir);
  if (!folderFsPath) return [];

  const thumbSet = new Set(THUMBNAIL_NAMES.map((n) => n.toLowerCase()));

  const files = fs
    .readdirSync(folderFsPath)
    .filter((name) => {
      const lower = name.toLowerCase();
      const ext = path.extname(lower);
      if (!IMAGE_EXT.has(ext)) return false;
      if (thumbSet.has(lower)) return false; // exclude thumbnail.* from gallery
      return true;
    })
    .sort((a, b) => a.localeCompare(b));

  return files.map((name) => `${assetsDir.replace(/\/+$/, "")}/${name}`);
}

function hydrateApartment(apartment) {
  const fallback = [
    "/assets/apartments/apartment1.jpeg",
    "/assets/apartments/apartment2.jpeg",
    "/assets/apartments/apartment3.jpeg",
  ];

  const galleryImages = listGalleryImagesForAssetsDir(apartment.assetsDir);
  const thumbnail = findThumbnailUrl(apartment.assetsDir);

  const image = galleryImages.length > 0 ? galleryImages : fallback;

  return {
    ...apartment,
    image,
    // For listing page:
    thumbnail: thumbnail || (image.length > 0 ? image[0] : fallback[0]),
  };
}

// ---- Routes ----

app.get("/api/apartments", (req, res) => {
  const apartments = readApartmentsFresh().map(hydrateApartment);
  res.json(apartments);
});

app.get("/api/apartments/filter", (req, res) => {
  const apartments = readApartmentsFresh();

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
    floor,
  } = req.query;

  let filtered = [...apartments];

  if (propertyType) filtered = filtered.filter((apt) => apt.propertyType === propertyType);
  if (location) filtered = filtered.filter((apt) => apt.location.toLowerCase() === location.toLowerCase());
  if (apartmentType) filtered = filtered.filter((apt) => apt.apartmentType === apartmentType);
  if (saleType) filtered = filtered.filter((apt) => apt.saleType === saleType);
  if (seaDistance) filtered = filtered.filter((apt) => apt.seaDistance === seaDistance);

  if (priceMin) filtered = filtered.filter((apt) => apt.price >= parseInt(priceMin));
  if (priceMax) filtered = filtered.filter((apt) => apt.price <= parseInt(priceMax));
  if (areaMin) filtered = filtered.filter((apt) => apt.area >= parseInt(areaMin));
  if (areaMax) filtered = filtered.filter((apt) => apt.area <= parseInt(areaMax));
  if (priceM2Min) filtered = filtered.filter((apt) => apt.pricePerM2 >= parseInt(priceM2Min));
  if (priceM2Max) filtered = filtered.filter((apt) => apt.pricePerM2 <= parseInt(priceM2Max));

  if (furnished) {
    const isFurnished = furnished === "yes";
    filtered = filtered.filter((apt) => apt.furnished === isFurnished);
  }

  if (view) {
    const views = Array.isArray(view) ? view : [view];
    filtered = filtered.filter((apt) => views.some((v) => apt.view.includes(v)));
  }

  if (floor) {
    const floors = Array.isArray(floor) ? floor : [floor];
    filtered = filtered.filter((apt) => floors.some((f) => apt.floorType.includes(f)));
  }

  res.json(filtered.map(hydrateApartment));
});

app.get("/api/apartments/:id", (req, res) => {
  const apartments = readApartmentsFresh();
  const apartment = apartments.find((apt) => apt.id === parseInt(req.params.id));

  if (!apartment) return res.status(404).json({ error: "Apartment not found" });

  res.json(hydrateApartment(apartment));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
