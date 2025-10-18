// 🔐 Capture et stocke l’UUID dès le chargement initial
(function () {
    const urlUUID = new URLSearchParams(window.location.search).get("uuid");
    if (urlUUID) {
        localStorage.setItem("wg_uuid", urlUUID);
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
    }
})();

// 🎭 Bannières par défaut
const defaultBanners = [
    "assets/img/1_wgcbanner.jpg",
    "assets/img/4_gatorsfoot.jpg",
    "assets/img/2_wgpdbanner.jpg",
    "assets/img/5_gatorsbasket.jpg",
    "assets/img/3_wgfdbanner.jpg",
    "assets/img/6_gatorstennis.jpg"
];

let bannerIndex = 0;
let bannerInterval = null;

// 🔐 Récupération de l’UUID stocké
const uuid = localStorage.getItem("wg_uuid");
console.log("UUID actif :", uuid);

// 🎖️ Mode admin si UUID reconnu
const ADMIN_UUIDS = [
    "24f8bb10-9088-4220-aa12-28ed2b006a9a"
];

if (ADMIN_UUIDS.includes(uuid)) {
    document.body.classList.add("admin-mode");
    document.querySelectorAll(".admin-only").forEach(el => {
        el.style.display = "block";
    });
}

// 📡 Endpoint serveur
const eventEndpoint = "https://wgevent.wintersgatesl.workers.dev/";

let events = [];

// ⏱️ Rafraîchissement automatique toutes les heures
setInterval(() => {
    location.reload();
}, 3600000); // 1h

startBannerRotation(); // ✅ Lance la rotation dès le chargement

fetch(eventEndpoint)
    .then(res => res.json())
    .then(data => {
        events = removeDuplicates(data);

        // 🕒 Heure SL (GMT-8)
        function getSLTime() {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const slOffset = -8;
            return new Date(utc + 3600000 * slOffset);
        }

        const now = getSLTime();
        const currentDate = now.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

        document.getElementById("currentDate").textContent = currentDate;

        // 📅 Filtrage : tous les événements du jour
        const today = now.toISOString().split("T")[0];

        const visibleEvents = events.filter(ev => {
            return ev.date === today;
        });

        renderEventList(visibleEvents);
    });

// 🔁 Supprime les doublons (titre + date)
function removeDuplicates(data) {
    const seen = new Set();
    return data.filter(event => {
        const key = `${event.title}-${event.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// 📋 Affiche la liste des événements
function renderEventList(events) {
    const list = document.querySelector(".event-list");
    list.innerHTML = "";

    events.forEach(event => {
        const block = document.createElement("div");
        block.className = "event-block";

        const line1 = document.createElement("div");
        line1.className = "event-title";
        const [h, m] = (event.time || "00:00").split(":").map(Number);
        const hour12 = ((h + 11) % 12) + 1;
        const suffix = h >= 12 ? "PM" : "AM";
        const formattedTime = `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
        line1.textContent = `🕒 ${formattedTime} – ${event.title}`;

        const line2 = document.createElement("div");
        line2.className = "event-meta";
        line2.textContent = `👤 Host: ${event.host || "–"}     📍 Where: ${event.location || "–"}`;

        block.appendChild(line1);
        block.appendChild(line2);
        list.appendChild(block);
    });
}

// 🎞️ Rotation des bannières par défaut
function startBannerRotation() {
    if (bannerInterval) return;
    document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
    bannerInterval = setInterval(() => {
        bannerIndex = (bannerIndex + 1) % defaultBanners.length;
        document.getElementById("eventBanner").src = defaultBanners[bannerIndex];
    }, 10000);
}

// 📤 Envoie un événement au serveur
function sendToCalendar(data) {
    if (uuid) data.uuid = uuid;

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
