const calendarEndpoint = "https://script.google.com/macros/s/AKfycbyY9tcS4saldRfcQmk14gyPDbjxmNtpJgXIY6YlV6gUINAMVRelUrMILvzTbWrNhNEK/exec";
const sheetJsonURL = "https://script.google.com/macros/s/AKfycbxyljx-PwvbSPA02e-NF-okSlFdnLY3SI21q_o3FohdxeWKf0g7esDqXHE5B5uduekR/exec"; // lecture depuis doGet()

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
    if (filteredEvents.length > 0) selectEvent(filteredEvents[0]);
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
