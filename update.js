const defaultBanners = [
  "assets/img/pub1.jpg",
  "assets/img/pub2.jpg",
  "assets/img/pub3.jpg"
];

let bannerIndex = 0;
let bannerInterval = null;

const userUUID = new URLSearchParams(window.location.search).get("uuid");
console.log("UUID détecté :", userUUID);

const ADMIN_UUIDS = [
  "24f8bb10-9088-4220-aa12-28ed2b006a9a"
];

const isAdmin = ADMIN_UUIDS.includes(userUUID);
if (isAdmin) {
  document.body.classList.add("admin-mode");
  document.querySelectorAll(".admin-only").forEach(el => {
  el.style.display = "block";
});

}


const calendarEndpoint = "https://script.google.com/macros/s/AKfycbyNOXEaH01GPOmuUZArZg7ZjUEI9SkJJrfuZOsOVs7tkrgs77bccJc4K1BbHQ11Xx0A/exec";
const sheetJsonURL = "https://script.google.com/macros/s/AKfycbwaeKW5mBtzoQ1FqeDYIamHKYN6699_Wh6QUUkiHUIxUyABq9Z28H1sFIPPC8ciZEBb/exec"; // lecture depuis doGet()

let events = [];

// 🔄 Charger les événements depuis la Sheet et afficher ceux du bloc horaire actuel
fetch(sheetJsonURL)
  .then(res => res.json())
  .then(data => {
    events = removeDuplicates(data);
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    document.getElementById("currentDate").textContent = currentDate;

    const blockStart = currentHour >= 6 && currentHour < 12 ? 6 :
                       currentHour >= 12 && currentHour < 18 ? 12 :
                       currentHour >= 18 && currentHour < 24 ? 18 : 0;
    const blockEnd = blockStart + 6;

    const filteredEvents = events.filter(event => {
      const [hour] = event.time.split(":").map(Number);
      return hour >= blockStart && hour < blockEnd;
    });

    renderEventList(filteredEvents);
    if (filteredEvents.length > 0) {
      selectEvent(filteredEvents[0]);
    } else {
      selectEvent(null); // lance les bannières pub
    }
  })
  .catch(err => console.error("Erreur de chargement :", err));


// 🧼 Supprimer les doublons (même titre + même date)
function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(event => {
    const key = `${event.title}-${event.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 🎭 Afficher les boutons d’événements
function renderEventList(events) {
  const list = document.querySelector(".event-list");
  list.innerHTML = "";
  events.forEach(event => {
    const btn = document.createElement("button");
    btn.textContent = `🕒 ${event.time} - ${event.title}`;
    btn.onclick = () => selectEvent(event);
    list.appendChild(btn);
  });
}

function startBannerRotation() {
  if (bannerInterval) return; // évite les doublons
  document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
  bannerInterval = setInterval(() => {
    bannerIndex = (bannerIndex + 1) % defaultBanners.length;
    document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
  }, 10000); // toutes les 10 secondes
}

function stopBannerRotation() {
  clearInterval(bannerInterval);
  bannerInterval = null;
}

// 🖼️ Mettre à jour le flyer et les infos
function selectEvent(event) {
  if (!event || !event.image) {
    startBannerRotation();
    document.getElementById("eventHost").textContent = "";
    document.getElementById("eventLocation").textContent = "";
    return;
  }

  stopBannerRotation();
  document.getElementById("eventHost").textContent = event.host || "";
  document.getElementById("eventLocation").textContent = event.location || "";
  document.getElementById("eventBanner").src = event.image;
}

// 📤 Ajouter un événement à Google Calendar
function sendToCalendar(data) {
  return fetch(calendarEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  }).then(res => {
    if (!res.ok) throw new Error("Erreur d'envoi à Calendar");
    return res.text();
  });
}
