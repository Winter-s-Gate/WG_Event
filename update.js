const calendarEndpoint = "https://script.google.com/macros/s/AKfycbwawIraJef1LN7a8ewwZSPzchFxjfiyXhucpWBXMu6v6MBbntE348AX8WlYTDH0GLRd/exec";
const eventJsonURL = "https://winter-s-gate.github.io/data/events.json"; // lecture
const backendWriteURL = "https://ton-backend/write-event"; // écriture
const backendDeleteURL = "https://ton-backend/delete-event"; // suppression

let events = [];

// 🔄 Charger les événements et afficher ceux du bloc horaire actuel
fetch(eventJsonURL)
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
    if (filteredEvents.length > 0) selectEvent(filteredEvents[0]);
  })
  .catch(err => console.error("Erreur de chargement :", err));

// 🧼 Supprimer les doublons (même titre + même date)
function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(event => {
    const key = `${event.title}-${event.start?.split("T")[0]}`;
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

// 🖼️ Mettre à jour le flyer et les infos
function selectEvent(event) {
  document.getElementById("eventHost").textContent = event.host || "";
  document.getElementById("eventLocation").textContent = event.location || "";
  document.getElementById("eventBanner").src = event.image || "https://via.placeholder.com/1024x300?text=RP+Flyer";
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

// 📁 Ajouter un événement à events.json via backend
function addToJson(data) {
  return fetch(backendWriteURL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
}

// 🗑️ Supprimer un événement via backend
function deleteFromJson(title, date) {
  return fetch(backendDeleteURL, {
    method: "POST",
    body: JSON.stringify({ title, date }),
    headers: { "Content-Type": "application/json" }
  });
}
