const STORAGE_KEY = "mycarplus_web_v2";

const $ = (id) => document.getElementById(id);

const fields = {
  ownerName: $("ownerName"),
  vehicleType: $("vehicleType"),
  brand: $("brand"),
  model: $("model"),
  year: $("year"),
  plate: $("plate"),
  insuranceDate: $("insuranceDate"),
  kteoDate: $("kteoDate"),
  currentKm: $("currentKm"),
  lastServiceKm: $("lastServiceKm"),
  serviceEveryKm: $("serviceEveryKm"),
  fuelCost: $("fuelCost"),
  serviceCost: $("serviceCost"),
  vehiclePhoto: $("vehiclePhoto")
};

const saveVehicleBtn = $("saveVehicleBtn");
const cancelEditBtn = $("cancelEditBtn");
const vehiclesList = $("vehiclesList");
const vehicleCount = $("vehicleCount");
const searchInput = $("searchInput");
const photoPreview = $("photoPreview");
const formTitle = $("formTitle");
const formSubtitle = $("formSubtitle");

let state = {
  ownerName: "",
  vehicles: []
};

let editingVehicleId = null;
let selectedPhotoData = "";

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    state = JSON.parse(raw);
  } catch (_) {
    state = { ownerName: "", vehicles: [] };
  }
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString + "T00:00:00");
  today.setHours(0, 0, 0, 0);
  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function dateStatusText(label, dateString) {
  const days = daysUntil(dateString);
  if (days === null) return { text: `${label}: δεν ορίστηκε`, cls: "warn", soon: false, expired: false };
  if (days < 0) return { text: `${label}: έληξε`, cls: "bad", soon: false, expired: true };
  if (days === 0) return { text: `${label}: σήμερα`, cls: "bad", soon: true, expired: false };
  if (days <= 7) return { text: `${label}: σε ${days} ημέρες`, cls: "warn", soon: true, expired: false };
  return { text: `${label}: σε ${days} ημέρες`, cls: "good", soon: false, expired: false };
}

function serviceStatus(vehicle) {
  const currentKm = Number(vehicle.currentKm || 0);
  const lastServiceKm = Number(vehicle.lastServiceKm || 0);
  const everyKm = Number(vehicle.serviceEveryKm || 0);

  if (!currentKm || !lastServiceKm || !everyKm) {
    return { text: "Service: δεν ορίστηκε", cls: "warn", soon: false, expired: false };
  }

  const nextService = lastServiceKm + everyKm;
  const left = nextService - currentKm;

  if (left <= 0) return { text: `Service: τώρα (${nextService} km)`, cls: "bad", soon: false, expired: true };
  if (left <= 500) return { text: `Service: σε ${left} km`, cls: "warn", soon: true, expired: false };
  return { text: `Service: σε ${left} km`, cls: "good", soon: false, expired: false };
}

function clearVehicleForm() {
  editingVehicleId = null;
  selectedPhotoData = "";
  fields.vehicleType.value = "Αυτοκίνητο";
  fields.brand.value = "";
  fields.model.value = "";
  fields.year.value = "";
  fields.plate.value = "";
  fields.insuranceDate.value = "";
  fields.kteoDate.value = "";
  fields.currentKm.value = "";
  fields.lastServiceKm.value = "";
  fields.serviceEveryKm.value = "";
  fields.fuelCost.value = "";
  fields.serviceCost.value = "";
  fields.vehiclePhoto.value = "";
  photoPreview.innerHTML = "📷";
  formTitle.textContent = "Προσθήκη οχήματος";
  formSubtitle.textContent = "Συμπλήρωσε τα στοιχεία του οχήματος.";
  saveVehicleBtn.textContent = "Προσθήκη οχήματος";
  cancelEditBtn.classList.add("hidden");
}

function renderDashboard() {
  const totalVehicles = state.vehicles.length;
  let soon = 0;
  let expired = 0;
  let costs = 0;

  state.vehicles.forEach(vehicle => {
    const insurance = dateStatusText("Ασφάλεια", vehicle.insuranceDate);
    const kteo = dateStatusText("ΚΤΕΟ", vehicle.kteoDate);
    const service = serviceStatus(vehicle);
    if (insurance.soon || kteo.soon || service.soon) soon++;
    if (insurance.expired || kteo.expired || service.expired) expired++;
    costs += Number(vehicle.fuelCost || 0) + Number(vehicle.serviceCost || 0);
  });

  $("dashVehicles").textContent = totalVehicles;
  $("dashSoon").textContent = soon;
  $("dashExpired").textContent = expired;
  $("dashCosts").textContent = `€${money(costs)}`;
}

function render() {
  fields.ownerName.value = state.ownerName || "";
  renderDashboard();

  const query = searchInput.value.trim().toLowerCase();
  const filtered = state.vehicles.filter(vehicle => {
    const haystack = `${vehicle.brand} ${vehicle.model} ${vehicle.plate} ${vehicle.type} ${vehicle.year}`.toLowerCase();
    return haystack.includes(query);
  });

  vehicleCount.textContent = filtered.length;

  if (filtered.length === 0) {
    vehiclesList.innerHTML = `<div class="empty">${state.vehicles.length === 0 ? "Δεν έχεις προσθέσει ακόμα όχημα." : "Δεν βρέθηκε όχημα."}</div>`;
    return;
  }

  vehiclesList.innerHTML = filtered.map(vehicleCardHtml).join("");
}

function vehicleCardHtml(vehicle) {
  const insurance = dateStatusText("Ασφάλεια", vehicle.insuranceDate);
  const kteo = dateStatusText("ΚΤΕΟ", vehicle.kteoDate);
  const service = serviceStatus(vehicle);
  const totalCost = Number(vehicle.fuelCost || 0) + Number(vehicle.serviceCost || 0);

  const photo = vehicle.photo
    ? `<img src="${vehicle.photo}" alt="Φωτογραφία οχήματος">`
    : vehicleEmoji(vehicle.type);

  return `
    <article class="vehicle-card">
      <div class="vehicle-top">
        <div class="vehicle-photo">${photo}</div>
        <div>
          <div class="vehicle-title">${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</div>
          <div class="vehicle-meta">${vehicleEmoji(vehicle.type)} ${escapeHtml(vehicle.type)} • ${escapeHtml(vehicle.year)} • ${escapeHtml(vehicle.plate)}</div>

          <div class="status-row">
            <span class="chip ${insurance.cls}">${insurance.text}</span>
            <span class="chip ${kteo.cls}">${kteo.text}</span>
            <span class="chip ${service.cls}">${service.text}</span>
          </div>

          <div class="costs">
            Καύσιμα: €${money(vehicle.fuelCost)} • Service/άλλα: €${money(vehicle.serviceCost)} • Σύνολο: €${money(totalCost)}
          </div>

          <div class="actions">
            <button class="edit-btn" onclick="editVehicle('${vehicle.id}')">Επεξεργασία</button>
            <button class="delete-btn" onclick="deleteVehicle('${vehicle.id}')">Διαγραφή</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function vehicleEmoji(type) {
  switch (type) {
    case "Αυτοκίνητο": return "🚗";
    case "Μηχανή": return "🏍️";
    case "Scooter": return "🛵";
    case "Van": return "🚐";
    case "Φορτηγό": return "🚚";
    case "ATV": return "🏎️";
    default: return "🚘";
  }
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormVehicleData(id) {
  return {
    id,
    type: fields.vehicleType.value,
    brand: fields.brand.value.trim(),
    model: fields.model.value.trim(),
    year: fields.year.value.trim(),
    plate: fields.plate.value.trim().toUpperCase(),
    insuranceDate: fields.insuranceDate.value,
    kteoDate: fields.kteoDate.value,
    currentKm: fields.currentKm.value,
    lastServiceKm: fields.lastServiceKm.value,
    serviceEveryKm: fields.serviceEveryKm.value,
    fuelCost: fields.fuelCost.value,
    serviceCost: fields.serviceCost.value,
    photo: selectedPhotoData
  };
}

function saveVehicle() {
  const brand = fields.brand.value.trim();
  const model = fields.model.value.trim();
  const year = fields.year.value.trim();
  const plate = fields.plate.value.trim();

  if (!brand || !model || !year || !plate) {
    alert("Συμπλήρωσε μάρκα, μοντέλο, έτος και πινακίδα.");
    return;
  }

  if (editingVehicleId) {
    const index = state.vehicles.findIndex(v => v.id === editingVehicleId);
    if (index !== -1) {
      state.vehicles[index] = getFormVehicleData(editingVehicleId);
    }
  } else {
    state.vehicles.push(getFormVehicleData(Date.now().toString()));
  }

  saveState();
  clearVehicleForm();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function editVehicle(id) {
  const vehicle = state.vehicles.find(v => v.id === id);
  if (!vehicle) return;

  editingVehicleId = id;
  selectedPhotoData = vehicle.photo || "";

  fields.vehicleType.value = vehicle.type || "Αυτοκίνητο";
  fields.brand.value = vehicle.brand || "";
  fields.model.value = vehicle.model || "";
  fields.year.value = vehicle.year || "";
  fields.plate.value = vehicle.plate || "";
  fields.insuranceDate.value = vehicle.insuranceDate || "";
  fields.kteoDate.value = vehicle.kteoDate || "";
  fields.currentKm.value = vehicle.currentKm || "";
  fields.lastServiceKm.value = vehicle.lastServiceKm || "";
  fields.serviceEveryKm.value = vehicle.serviceEveryKm || "";
  fields.fuelCost.value = vehicle.fuelCost || "";
  fields.serviceCost.value = vehicle.serviceCost || "";

  photoPreview.innerHTML = selectedPhotoData ? `<img src="${selectedPhotoData}" alt="Φωτογραφία">` : "📷";

  formTitle.textContent = "Επεξεργασία οχήματος";
  formSubtitle.textContent = "Άλλαξε τα στοιχεία και πάτα αποθήκευση.";
  saveVehicleBtn.textContent = "Αποθήκευση αλλαγών";
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 260, behavior: "smooth" });
}

function deleteVehicle(id) {
  const vehicle = state.vehicles.find(v => v.id === id);
  const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : "αυτό το όχημα";
  if (!confirm(`Να διαγραφεί το ${name};`)) return;

  state.vehicles = state.vehicles.filter(v => v.id !== id);

  if (editingVehicleId === id) clearVehicleForm();

  saveState();
  render();
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 700000) {
    alert("Η φωτογραφία είναι μεγάλη. Προτίμησε μικρότερη εικόνα.");
    fields.vehiclePhoto.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedPhotoData = reader.result;
    photoPreview.innerHTML = `<img src="${selectedPhotoData}" alt="Φωτογραφία">`;
  };
  reader.readAsDataURL(file);
}

fields.ownerName.addEventListener("input", () => {
  state.ownerName = fields.ownerName.value;
  saveState();
});

fields.vehiclePhoto.addEventListener("change", handlePhotoUpload);
saveVehicleBtn.addEventListener("click", saveVehicle);
cancelEditBtn.addEventListener("click", clearVehicleForm);
searchInput.addEventListener("input", render);

loadState();
render();
