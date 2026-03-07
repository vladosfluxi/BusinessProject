// /admin/js/dashboard.js

/* ---------- Helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function renderValue(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeImageList(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function resolveAdminImageUrl(p) {
  if (!p) return "/assets/apartments/apartment1.jpeg";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return p;
  if (p.startsWith("assets/")) return `/${p}`;
  return `/assets/apartments/${p}`;
}

/* ---------- Loaders ---------- */

async function loadApartments() {
  const response = await fetch("../php/apartments.php", {
    credentials: "include",
    cache: "no-store",
  });

  const text = await response.text();
  console.log("apartments.php status:", response.status);

  if (!response.ok) throw new Error(`Failed: ${response.status} body=${text.slice(0, 200)}`);
  if (!text.trim()) throw new Error("apartments.php returned an empty body");

  return JSON.parse(text);
}

async function loadMessages() {
  const response = await fetch("../php/messages.php", {
    credentials: "include",
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) throw new Error(`Failed: ${response.status} body=${text.slice(0, 200)}`);
  if (!text.trim()) return { messages: [] };

  return JSON.parse(text);
}

/* ---------- API Calls ---------- */

async function createApartment(data, opts) {
  opts = opts || {};
  const galleryFiles = opts.galleryFiles || [];
  const thumbnailFile = opts.thumbnailFile || null;

  const hasGallery = Array.isArray(galleryFiles) && galleryFiles.length > 0;
  const hasThumb = !!thumbnailFile;
  const useMultipart = hasGallery || hasThumb;

  let res;

  if (useMultipart) {
    const fd = new FormData();
    fd.append("data", JSON.stringify(data));
    if (hasGallery) galleryFiles.forEach((f) => fd.append("images[]", f));
    if (hasThumb) fd.append("thumbnail", thumbnailFile);

    res = await fetch("../php/apartment_create.php", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
  } else {
    res = await fetch("../php/apartment_create.php", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data }),
    });
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`Create failed: ${res.status} ${text.slice(0, 200)}`);
  return text.trim() ? JSON.parse(text) : null;
}

async function updateApartment(id, data, opts) {
  opts = opts || {};
  const galleryFiles = opts.galleryFiles || [];
  const thumbnailFile = opts.thumbnailFile || null;
  const deleteImages = opts.deleteImages || [];

  const hasGallery = Array.isArray(galleryFiles) && galleryFiles.length > 0;
  const hasThumb = !!thumbnailFile;
  const hasDeletes = Array.isArray(deleteImages) && deleteImages.length > 0;
  const useMultipart = hasGallery || hasThumb || hasDeletes;

  let res;

  if (useMultipart) {
    const fd = new FormData();
    fd.append("id", String(id));
    fd.append("data", JSON.stringify(data));
    if (hasGallery) galleryFiles.forEach((f) => fd.append("images[]", f));
    if (hasThumb) fd.append("thumbnail", thumbnailFile);
    if (hasDeletes) fd.append("deleteImages", JSON.stringify(deleteImages));

    res = await fetch("../php/apartment_update.php", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
  } else {
    res = await fetch("../php/apartment_update.php", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, data, deleteImages }),
    });
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`Update failed: ${res.status} ${text.slice(0, 200)}`);
  return text.trim() ? JSON.parse(text) : null;
}

async function deleteApartment(id) {
  const res = await fetch("../php/apartment_delete.php", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Delete failed: ${res.status} ${text.slice(0, 200)}`);
  return text.trim() ? JSON.parse(text) : { ok: true };
}

/* ---------- Translation Block Builder ---------- */

const LANGS = [
  { code: "en", label: "English" },
  { code: "bg", label: "Bulgarian" },
  { code: "ru", label: "Russian" },
];

/**
 * Builds a tabbed translation editor for title, location, and description.
 * @param {object|null} offer  – existing offer (null for create)
 * @returns {{ node: HTMLElement, getValues: function }}
 */
function makeTranslationEditor(offer) {
  const wrap = el("div", "translation-editor");

  // Tab bar
  const tabBar = el("div", "trans-tab-bar");
  const panels = new Map();
  const inputs = {};

  LANGS.forEach(({ code, label }, i) => {
    // Tab button
    const tab = el("button", "trans-tab" + (i === 0 ? " trans-tab-active" : ""), label);
    tab.type = "button";
    tab.dataset.lang = code;
    tabBar.appendChild(tab);

    // Panel
    const panel = el("div", "trans-panel");
    if (i !== 0) panel.style.display = "none";
    panel.dataset.lang = code;

    inputs[code] = {};

    // Title
    const titleLabel = el("label", "", `Title (${label})`);
    titleLabel.htmlFor = `trans_title_${code}`;
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.id = `trans_title_${code}`;
    titleInput.placeholder = `Title in ${label}`;
    titleInput.value = offer?.titleTranslations?.[code] ?? (code === "en" ? (offer?.title ?? "") : "");
    panel.appendChild(titleLabel);
    panel.appendChild(titleInput);
    inputs[code].title = titleInput;

    // Location
    const locLabel = el("label", "", `Location (${label})`);
    locLabel.htmlFor = `trans_location_${code}`;
    const locInput = document.createElement("input");
    locInput.type = "text";
    locInput.id = `trans_location_${code}`;
    locInput.placeholder = `Location in ${label}`;
    locInput.value = offer?.locationTranslations?.[code] ?? (code === "en" ? (offer?.location ?? "") : "");
    panel.appendChild(locLabel);
    panel.appendChild(locInput);
    inputs[code].location = locInput;

    // Description
    const descLabel = el("label", "", `Description (${label})`);
    descLabel.htmlFor = `trans_desc_${code}`;
    const descInput = document.createElement("textarea");
    descInput.id = `trans_desc_${code}`;
    descInput.rows = 4;
    descInput.placeholder = `Description in ${label}`;
    descInput.value = offer?.descriptionTranslations?.[code] ?? (code === "en" ? (offer?.description ?? "") : "");
    panel.appendChild(descLabel);
    panel.appendChild(descInput);
    inputs[code].description = descInput;

    panels.set(code, panel);
    wrap.appendChild(panel);
  });

  wrap.insertBefore(tabBar, wrap.firstChild);

  // Tab switching
  tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".trans-tab");
    if (!btn) return;
    const lang = btn.dataset.lang;

    tabBar.querySelectorAll(".trans-tab").forEach((t) => t.classList.remove("trans-tab-active"));
    btn.classList.add("trans-tab-active");

    panels.forEach((panel, code) => {
      panel.style.display = code === lang ? "" : "none";
    });
  });

  return {
    node: wrap,
    /**
     * Returns { title, location, description, titleTranslations, locationTranslations, descriptionTranslations }
     * The root title/location/description are always taken from the English tab (primary language).
     */
    getValues() {
      const titleTranslations = {};
      const locationTranslations = {};
      const descriptionTranslations = {};

      LANGS.forEach(({ code }) => {
        titleTranslations[code] = inputs[code].title.value.trim();
        locationTranslations[code] = inputs[code].location.value.trim();
        descriptionTranslations[code] = inputs[code].description.value.trim();
      });

      return {
        title: titleTranslations.en || "",
        location: locationTranslations.en || "",
        description: descriptionTranslations.en || "",
        titleTranslations,
        locationTranslations,
        descriptionTranslations,
      };
    },
  };
}

/* ---------- Image Editors ---------- */

function makeThumbnailEditor(offer) {
  const wrap = el("div", "thumb-editor");
  wrap.appendChild(el("div", "image-editor-title", "Thumbnail image"));
  wrap.appendChild(el("div", "image-editor-sub", "Used in listing cards."));

  const img = document.createElement("img");
  img.className = "thumb-preview";
  img.src = offer ? resolveAdminImageUrl(offer.thumbnail) : "/assets/apartments/apartment1.jpeg";
  img.alt = "Thumbnail preview";
  wrap.appendChild(img);

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.className = "image-file";
  wrap.appendChild(file);

  const hint = el("div", "image-hint", "No thumbnail selected.");
  wrap.appendChild(hint);

  let blobUrl = null;
  let selected = null;

  file.addEventListener("change", () => {
    selected = (file.files && file.files[0]) || null;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = null;

    if (!selected) {
      img.src = offer ? resolveAdminImageUrl(offer.thumbnail) : "/assets/apartments/apartment1.jpeg";
      hint.textContent = "No thumbnail selected.";
      return;
    }

    blobUrl = URL.createObjectURL(selected);
    img.src = blobUrl;
    hint.textContent = `Selected: ${selected.name}`;
  });

  const clear = el("button", "small-btn small-btn-danger", "Clear selection");
  clear.type = "button";
  clear.addEventListener("click", () => {
    file.value = "";
    selected = null;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = null;
    img.src = offer ? resolveAdminImageUrl(offer.thumbnail) : "/assets/apartments/apartment1.jpeg";
    hint.textContent = "No thumbnail selected.";
  });
  wrap.appendChild(clear);

  return {
    node: wrap,
    getFile() { return selected; },
    cleanup() { if (blobUrl) URL.revokeObjectURL(blobUrl); },
  };
}

function makeGalleryEditor(offer) {
  const wrap = el("div", "image-editor");
  wrap.appendChild(el("div", "image-editor-title", "Gallery images"));
  wrap.appendChild(el("div", "image-editor-sub", offer ? "Delete existing images or upload new ones." : "Upload gallery images."));

  const current = offer ? normalizeImageList(offer.image) : [];
  const deleteSet = new Set();

  const preview = el("div", "image-preview-grid");
  wrap.appendChild(preview);

  function renderExisting() {
    preview.innerHTML = "";
    if (!current.length) {
      preview.appendChild(el("div", "preview-empty", "No images"));
      return;
    }
    current.forEach((src) => {
      const item = el("div", "preview-item");
      if (deleteSet.has(src)) item.classList.add("marked-delete");

      const img = document.createElement("img");
      img.className = "preview-thumb";
      img.src = resolveAdminImageUrl(src);
      img.alt = "Offer image";
      img.loading = "lazy";

      const overlay = el("div", "preview-overlay");
      const btn = el("button", "small-btn small-btn-danger", deleteSet.has(src) ? "Undo" : "Delete");
      btn.type = "button";
      btn.addEventListener("click", () => {
        deleteSet.has(src) ? deleteSet.delete(src) : deleteSet.add(src);
        renderExisting();
        renderHint();
      });
      overlay.appendChild(btn);
      item.appendChild(img);
      item.appendChild(overlay);
      preview.appendChild(item);
    });
  }

  const file = document.createElement("input");
  file.type = "file";
  file.multiple = true;
  file.accept = "image/*";
  file.className = "image-file";
  wrap.appendChild(file);

  const hint = el("div", "image-hint", "");
  wrap.appendChild(hint);

  let uploadFiles = [];
  let uploadBlobUrls = [];

  const uploadPreview = el("div", "image-preview-grid");
  uploadPreview.classList.add("upload-preview");
  wrap.appendChild(el("div", "image-control-label", "New uploads preview"));
  wrap.appendChild(uploadPreview);

  function renderUploadPreview() {
    uploadPreview.innerHTML = "";
    if (!uploadFiles.length) {
      uploadPreview.appendChild(el("div", "preview-empty", "No uploads selected"));
      return;
    }
    uploadFiles.forEach((f) => {
      const item = el("div", "preview-item");
      const img = document.createElement("img");
      img.className = "preview-thumb";
      const blob = URL.createObjectURL(f);
      uploadBlobUrls.push(blob);
      img.src = blob;
      item.appendChild(img);
      uploadPreview.appendChild(item);
    });
  }

  function renderHint() {
    const parts = [];
    if (offer && deleteSet.size) parts.push(`Marked for delete: ${deleteSet.size}`);
    if (uploadFiles.length) parts.push(`New uploads: ${uploadFiles.length}`);
    hint.textContent = parts.length ? parts.join(" • ") : (offer ? "No gallery changes." : "No images selected.");
  }

  file.addEventListener("change", () => {
    uploadBlobUrls.forEach((u) => URL.revokeObjectURL(u));
    uploadBlobUrls = [];
    uploadFiles = Array.from(file.files || []);
    renderUploadPreview();
    renderHint();
  });

  const row = el("div", "image-actions-row");

  const clearUploads = el("button", "small-btn", "Clear uploads");
  clearUploads.type = "button";
  clearUploads.addEventListener("click", () => {
    file.value = "";
    uploadFiles = [];
    uploadBlobUrls.forEach((u) => URL.revokeObjectURL(u));
    uploadBlobUrls = [];
    renderUploadPreview();
    renderHint();
  });
  row.appendChild(clearUploads);

  if (offer) {
    const clearDeletes = el("button", "small-btn", "Clear deletes");
    clearDeletes.type = "button";
    clearDeletes.addEventListener("click", () => {
      deleteSet.clear();
      renderExisting();
      renderHint();
    });
    row.appendChild(clearDeletes);
  }

  wrap.appendChild(row);

  if (offer) renderExisting();
  renderUploadPreview();
  renderHint();

  return {
    node: wrap,
    getDeleteImages() { return Array.from(deleteSet); },
    getUploadFiles() { return uploadFiles; },
    cleanup() { uploadBlobUrls.forEach((u) => URL.revokeObjectURL(u)); },
  };
}

/* ---------- Create Modal ---------- */

function openCreateModal(onCreated) {
  const backdrop = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  backdrop.appendChild(modal);

  const header = el("div", "modal-header");
  header.appendChild(el("h3", "", "Create New Apartment"));
  const closeBtn = el("button", "btn", "Close");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => backdrop.remove());
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const form = document.createElement("form");
  const grid = el("div", "form-grid");

  // Non-translatable fields
  const fields = [
    { key: "price", label: "Price (€)", type: "number", required: true },
    { key: "area", label: "Area (m²)", type: "number", required: true },
    { key: "pricePerM2", label: "Price per m² (€)", type: "number", required: true },
    { key: "floor", label: "Floor", type: "number", required: false },
    { key: "propertyType", label: "Property Type", type: "select", options: ["apartment", "house"], required: true },
    { key: "apartmentType", label: "Apartment Type", type: "select", options: ["1room", "2room", "3room", "4room", "multiroom"], required: true },
    { key: "saleType", label: "Sale Type", type: "select", options: ["secondary", "investor"], required: true },
    { key: "seaDistance", label: "Distance to Sea", type: "select", options: [null, "0-100", "100-500", "500-1000", "1000+"], required: false },
    { key: "furnished", label: "Furnished", type: "checkbox", required: false },
  ];

  const inputs = new Map();

  fields.forEach((field) => {
    const label = document.createElement("label");
    label.htmlFor = "create_" + field.key;
    label.textContent = field.label + (field.required ? " *" : "");

    let input;
    if (field.type === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
    } else if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt === null ? "" : String(opt);
        option.textContent = opt === null ? "N/A" : String(opt);
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
    }

    input.id = "create_" + field.key;
    input.name = field.key;
    if (field.required && field.type !== "checkbox") input.required = true;

    inputs.set(field.key, { input, type: field.type });
    grid.appendChild(label);
    grid.appendChild(input);
  });

  form.appendChild(grid);

  // --- Translations block ---
  form.appendChild(el("div", "section-label", "Title, Location & Description"));
  const transEditor = makeTranslationEditor(null);
  form.appendChild(transEditor.node);

  // View multi-select
  form.appendChild(el("div", "section-label", "View"));
  const viewOptions = ["sea", "mountain", "city", "lake", "pool", "forest"];
  const viewCheckboxes = new Map();
  viewOptions.forEach((opt) => {
    const container = el("div", "checkbox-inline");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "view_" + opt;
    checkbox.value = opt;
    const label = document.createElement("label");
    label.htmlFor = "view_" + opt;
    label.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    container.appendChild(checkbox);
    container.appendChild(label);
    form.appendChild(container);
    viewCheckboxes.set(opt, checkbox);
  });

  // Floor type multi-select
  form.appendChild(el("div", "section-label", "Floor Type"));
  const floorLabels = { ground: "Ground Floor", top: "Top Floor", "no-ground": "Without Ground", "no-top": "Without Top" };
  const floorCheckboxes = new Map();
  Object.keys(floorLabels).forEach((opt) => {
    const container = el("div", "checkbox-inline");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "floor_" + opt;
    checkbox.value = opt;
    const label = document.createElement("label");
    label.htmlFor = "floor_" + opt;
    label.textContent = floorLabels[opt];
    container.appendChild(checkbox);
    container.appendChild(label);
    form.appendChild(container);
    floorCheckboxes.set(opt, checkbox);
  });

  // Thumbnail
  form.appendChild(el("div", "section-label", "Thumbnail"));
  const thumbEditor = makeThumbnailEditor(null);
  form.appendChild(thumbEditor.node);

  // Gallery
  form.appendChild(el("div", "section-label", "Gallery Images"));
  const galleryEditor = makeGalleryEditor(null);
  form.appendChild(galleryEditor.node);

  const actions = el("div", "modal-actions");
  const cancelBtn = el("button", "btn", "Cancel");
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => {
    thumbEditor.cleanup();
    galleryEditor.cleanup();
    backdrop.remove();
  });

  const createBtn = el("button", "btn btn-primary", "Create");
  createBtn.type = "submit";
  actions.appendChild(cancelBtn);
  actions.appendChild(createBtn);
  form.appendChild(actions);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {};

    for (const [key, obj] of inputs.entries()) {
      const { input, type } = obj;
      if (type === "checkbox") {
        data[key] = input.checked;
      } else if (type === "number") {
        const val = input.value.trim();
        data[key] = val ? Number(val) : null;
      } else if (input.value.trim()) {
        data[key] = input.value.trim();
      }
    }

    // Merge translations (title, location, description + their *Translations objects)
    Object.assign(data, transEditor.getValues());

    // View
    const view = [];
    for (const [opt, checkbox] of viewCheckboxes.entries()) {
      if (checkbox.checked) view.push(opt);
    }
    if (view.length) data.view = view;

    // Floor type
    const floorType = [];
    for (const [opt, checkbox] of floorCheckboxes.entries()) {
      if (checkbox.checked) floorType.push(opt);
    }
    if (floorType.length) data.floorType = floorType;

    try {
      const created = await createApartment(data, {
        galleryFiles: galleryEditor.getUploadFiles(),
        thumbnailFile: thumbEditor.getFile(),
      });

      await new Promise((r) => setTimeout(r, 500));
      backdrop.remove();
      onCreated(created);
    } catch (err) {
      console.error(err);
      alert("Failed to create apartment.\n\n" + err.message);
    }
  });

  modal.appendChild(form);
  document.body.appendChild(backdrop);
}

/* ---------- Edit Modal ---------- */

function openEditModal(offer, onSaved) {
  const backdrop = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  backdrop.appendChild(modal);

  const header = el("div", "modal-header");
  header.appendChild(el("h3", "", "Edit Offer #" + offer.id));
  const closeBtn = el("button", "btn", "Close");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => backdrop.remove());
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const form = document.createElement("form");
  const grid = el("div", "form-grid");

  // All keys except those handled separately
  const skipKeys = ["id", "image", "thumbnail", "view", "floorType",
                    "title", "location", "description",
                    "titleTranslations", "locationTranslations", "descriptionTranslations"];

  const keys = Object.keys(offer).filter((k) => !skipKeys.includes(k));

  const preferred = [
    "price", "area", "pricePerM2", "floor",
    "propertyType", "apartmentType", "saleType", "seaDistance", "furnished", "assetsDir",
  ];
  const ordered = preferred.filter((k) => keys.includes(k)).concat(keys.filter((k) => !preferred.includes(k)));

  const inputs = new Map();

  function guessFieldType(key, value) {
    if (typeof value === "boolean") return "checkbox";
    if (typeof value === "number") return "number";
    if (Array.isArray(value) || (value && typeof value === "object")) return "textarea";
    return "text";
  }

  function valueToString(value) {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value, null, 2);
    return String(value);
  }

  function parseEditedValue(originalValue, inputEl) {
    const t = inputEl.dataset.fieldType;
    if (t === "checkbox") return inputEl.checked;
    const raw = inputEl.value;
    if (!raw.trim()) return null;
    if (t === "number") {
      const n = Number(raw);
      return Number.isFinite(n) ? n : originalValue;
    }
    if (Array.isArray(originalValue) || (originalValue && typeof originalValue === "object")) {
      try { return JSON.parse(raw); } catch (e) { return raw; }
    }
    return raw;
  }

  for (const key of ordered) {
    const originalValue = offer[key];
    const fieldType = guessFieldType(key, originalValue);

    const label = document.createElement("label");
    label.htmlFor = "edit_" + key;
    label.textContent = key;

    let input;
    if (fieldType === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
      input.value = valueToString(originalValue);
      input.dataset.fieldType = fieldType;
    } else if (fieldType === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(originalValue);
      input.dataset.fieldType = fieldType;
    } else {
      input = document.createElement("input");
      input.type = fieldType;
      input.value = valueToString(originalValue);
      input.dataset.fieldType = fieldType;
    }

    input.id = "edit_" + key;
    input.name = key;
    inputs.set(key, { input, originalValue });
    grid.appendChild(label);
    grid.appendChild(input);
  }

  form.appendChild(grid);

  // --- Translations block ---
  form.appendChild(el("div", "section-label", "Title, Location & Description"));
  const transEditor = makeTranslationEditor(offer);
  form.appendChild(transEditor.node);

  // View multi-select
  form.appendChild(el("div", "section-label", "View"));
  const currentView = offer.view || [];
  const viewCheckboxes = new Map();
  ["sea", "mountain", "city", "lake", "pool", "forest"].forEach((opt) => {
    const container = el("div", "checkbox-inline");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "view_" + opt;
    checkbox.value = opt;
    checkbox.checked = currentView.includes(opt);
    const label = document.createElement("label");
    label.htmlFor = "view_" + opt;
    label.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    container.appendChild(checkbox);
    container.appendChild(label);
    form.appendChild(container);
    viewCheckboxes.set(opt, checkbox);
  });

  // Floor type multi-select
  form.appendChild(el("div", "section-label", "Floor Type"));
  const currentFloor = offer.floorType || [];
  const floorLabels = { ground: "Ground Floor", top: "Top Floor", "no-ground": "Without Ground", "no-top": "Without Top" };
  const floorCheckboxes = new Map();
  Object.keys(floorLabels).forEach((opt) => {
    const container = el("div", "checkbox-inline");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "floor_" + opt;
    checkbox.value = opt;
    checkbox.checked = currentFloor.includes(opt);
    const label = document.createElement("label");
    label.htmlFor = "floor_" + opt;
    label.textContent = floorLabels[opt];
    container.appendChild(checkbox);
    container.appendChild(label);
    form.appendChild(container);
    floorCheckboxes.set(opt, checkbox);
  });

  // Thumbnail
  form.appendChild(el("div", "section-label", "Thumbnail"));
  const thumbEditor = makeThumbnailEditor(offer);
  form.appendChild(thumbEditor.node);

  // Gallery
  form.appendChild(el("div", "section-label", "Gallery"));
  const galleryEditor = makeGalleryEditor(offer);
  form.appendChild(galleryEditor.node);

  const actions = el("div", "modal-actions");
  const cancelBtn = el("button", "btn", "Cancel");
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => {
    thumbEditor.cleanup();
    galleryEditor.cleanup();
    backdrop.remove();
  });

  const saveBtn = el("button", "btn btn-primary", "Save");
  saveBtn.type = "submit";
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updated = {};
    for (const [key, obj] of inputs.entries()) {
      updated[key] = parseEditedValue(obj.originalValue, obj.input);
    }

    // Merge translations
    Object.assign(updated, transEditor.getValues());

    // View
    const newView = [];
    for (const [opt, checkbox] of viewCheckboxes.entries()) {
      if (checkbox.checked) newView.push(opt);
    }
    updated.view = newView;

    // Floor type
    const newFloor = [];
    for (const [opt, checkbox] of floorCheckboxes.entries()) {
      if (checkbox.checked) newFloor.push(opt);
    }
    updated.floorType = newFloor;

    try {
      const saved = await updateApartment(offer.id, updated, {
        deleteImages: galleryEditor.getDeleteImages(),
        galleryFiles: galleryEditor.getUploadFiles(),
        thumbnailFile: thumbEditor.getFile(),
      });

      await new Promise((r) => setTimeout(r, 500));
      const all = await loadApartments();
      const fresh = Array.isArray(all) ? all.find((o) => Number(o.id) === Number(offer.id)) : null;

      backdrop.remove();
      onSaved(fresh || saved || Object.assign({}, offer, updated, { id: offer.id }));
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check console / network.");
    }
  });

  modal.appendChild(form);
  document.body.appendChild(backdrop);
}

/* ---------- Messages UI ---------- */

function renderMessages(container, messages) {
  container.innerHTML = "";

  if (!Array.isArray(messages) || messages.length === 0) {
    container.appendChild(el("p", "empty", "No messages found."));
    return;
  }

  messages.forEach((m) => {
    const card = el("div", "message-card");

    const nameRow = el("div", "message-row");
    nameRow.appendChild(el("span", "message-label", "Full name: "));
    nameRow.appendChild(el("span", "message-value", m.fullName || "-"));
    card.appendChild(nameRow);

    const emailRow = el("div", "message-row");
    emailRow.appendChild(el("span", "message-label", "Email: "));
    emailRow.appendChild(el("span", "message-value", m.email || "-"));
    card.appendChild(emailRow);

    const phoneRow = el("div", "message-row");
    phoneRow.appendChild(el("span", "message-label", "Phone number: "));
    phoneRow.appendChild(el("span", "message-value", m.phone || "-"));
    card.appendChild(phoneRow);

    card.appendChild(el("div", "message-section-title", "Subject:"));
    card.appendChild(el("div", "message-section-body", m.subject || "-"));

    card.appendChild(el("div", "message-section-title", "Message:"));
    card.appendChild(el("div", "message-section-body", m.message || "-"));

    container.appendChild(card);
  });
}

/* ---------- Tabs ---------- */

function setActiveTab(tab) {
  const tabA = document.getElementById("tab-apartments");
  const tabM = document.getElementById("tab-messages");
  const viewA = document.getElementById("view-apartments");
  const viewM = document.getElementById("view-messages");

  if (!tabA || !tabM || !viewA || !viewM) return;

  if (tab === "messages") {
    tabA.classList.remove("active");
    tabM.classList.add("active");
    viewA.classList.add("hidden");
    viewM.classList.remove("hidden");
  } else {
    tabM.classList.remove("active");
    tabA.classList.add("active");
    viewM.classList.add("hidden");
    viewA.classList.remove("hidden");
  }
}

/* ---------- Cards ---------- */

function createOfferCard(offer) {
  const card = el("article", "offer-card");
  card.dataset.offerId = offer.id;

  const header = el("div", "offer-header");
  header.appendChild(el("h2", "offer-title", offer.title || ("Offer #" + offer.id)));
  header.appendChild(el("div", "offer-subtitle", ("ID: " + offer.id + " • " + (offer.location || "")).trim()));
  card.appendChild(header);

  const thumb = offer.thumbnail ? resolveAdminImageUrl(offer.thumbnail) : null;
  if (thumb) {
    const thumbWrap = el("div", "offer-thumb");
    const timg = document.createElement("img");
    timg.className = "offer-thumb-img";
    timg.src = thumb;
    timg.alt = "Thumbnail";
    timg.loading = "lazy";
    thumbWrap.appendChild(timg);
    card.appendChild(thumbWrap);
  }

  const imagesWrap = el("div", "offer-images");
  const images = normalizeImageList(offer.image);
  if (images.length === 0) {
    imagesWrap.appendChild(el("div", "offer-images-empty", "No images"));
  } else {
    images.forEach((src) => {
      const img = document.createElement("img");
      img.className = "offer-image";
      img.src = resolveAdminImageUrl(src);
      img.alt = offer.title || "Offer image";
      img.loading = "lazy";
      imagesWrap.appendChild(img);
    });
  }
  card.appendChild(imagesWrap);

  if (offer.description) card.appendChild(el("p", "offer-description", offer.description));

  const actions = el("div", "offer-actions");
  const editBtn = el("button", "btn btn-primary", "Edit");
  const delBtn = el("button", "btn btn-danger", "Delete");
  editBtn.type = "button";
  delBtn.type = "button";

  editBtn.addEventListener("click", () => {
    openEditModal(offer, (newOffer) => {
      const fresh = createOfferCard(newOffer);
      card.replaceWith(fresh);
    });
  });

  delBtn.addEventListener("click", async () => {
    if (!confirm("Delete offer #" + offer.id + "?")) return;
    try {
      await deleteApartment(offer.id);
      card.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to delete. Check console / network.");
    }
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  card.appendChild(actions);

  const grid = el("div", "offer-grid");
  const preferredOrder = [
    "price", "area", "pricePerM2", "floor", "propertyType", "apartmentType",
    "saleType", "seaDistance", "furnished", "view", "floorType", "assetsDir",
  ];

  preferredOrder.forEach((key) => {
    if (key in offer) {
      const row = el("div", "kv");
      row.appendChild(el("div", "k", key));
      row.appendChild(el("div", "v", renderValue(offer[key])));
      grid.appendChild(row);
    }
  });

  // Show translation summary on the card
  if (offer.titleTranslations || offer.descriptionTranslations) {
    const transRow = el("div", "kv");
    transRow.appendChild(el("div", "k", "translations"));
    const langs = LANGS.map(({ code, label }) => {
      const t = offer.titleTranslations?.[code];
      return t ? `${label}: ${t}` : null;
    }).filter(Boolean).join(" | ");
    transRow.appendChild(el("div", "v", langs || "—"));
    grid.appendChild(transRow);
  }

  Object.keys(offer)
    .filter((k) => !preferredOrder.includes(k) &&
      !["id", "title", "location", "description", "image", "thumbnail",
        "titleTranslations", "locationTranslations", "descriptionTranslations"].includes(k))
    .forEach((key) => {
      const row = el("div", "kv");
      row.appendChild(el("div", "k", key));
      row.appendChild(el("div", "v", renderValue(offer[key])));
      grid.appendChild(row);
    });

  card.appendChild(grid);
  return card;
}

/* ---------- Main ---------- */

async function main() {
  const offersContainer = document.getElementById("offers");
  const messagesContainer = document.getElementById("messages");
  const tabA = document.getElementById("tab-apartments");
  const tabM = document.getElementById("tab-messages");

  if (!offersContainer || !messagesContainer || !tabA || !tabM) return;

  setActiveTab("apartments");

  const createBtn = el("button", "btn btn-success", "+ Create New");
  createBtn.type = "button";
  createBtn.style.marginBottom = "20px";
  createBtn.addEventListener("click", () => {
    openCreateModal(() => { location.reload(); });
  });
  offersContainer.parentNode.insertBefore(createBtn, offersContainer);

  offersContainer.innerHTML = "";
  try {
    const offers = await loadApartments();
    if (!Array.isArray(offers) || offers.length === 0) {
      offersContainer.appendChild(el("p", "empty", "No offers found."));
    } else {
      offers.forEach((offer) => offersContainer.appendChild(createOfferCard(offer)));
    }
  } catch (err) {
    console.error(err);
    offersContainer.appendChild(el("p", "error", String(err.message || err)));
  }

  tabA.addEventListener("click", () => setActiveTab("apartments"));

  tabM.addEventListener("click", async () => {
    setActiveTab("messages");
    messagesContainer.innerHTML = "";
    try {
      const data = await loadMessages();
      renderMessages(messagesContainer, data.messages);
    } catch (err) {
      console.error(err);
      messagesContainer.appendChild(el("p", "error", String(err.message || err)));
    }
  });
}

document.addEventListener("DOMContentLoaded", main);
