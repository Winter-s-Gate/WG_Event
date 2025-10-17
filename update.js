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

const eventEndpoint = "https://wgevent.wintersgatesl.workers.dev/"

let events = [];

fetch(eventEndpoint)
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
      selectEvent(null);
    }
  })
  .catch(err => console.error("Erreur de chargement :", err));

function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(event => {
    const key = `${event.title}-${event.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
  if (bannerInterval) return;
  document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
  bannerInterval = setInterval(() => {
    bannerIndex = (bannerIndex + 1) % defaultBanners.length;
    document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
  }, 10000);
}

function stopBannerRotation() {
  clearInterval(bannerInterval);
  bannerInterval = null;
}

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

function sendToCalendar(data) {
  return fetch(eventEndpoint, {
    method: "POST",
    body: new URLSearchParams(data).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    }
  }).then(res => {
    if (!res.ok) throw new Error("Erreur d'envoi à Calendar");
    return res.text();
  });
}
