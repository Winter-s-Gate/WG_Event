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
  "assets/img/2_wgpdbanner.jpg",
  "assets/img/pub3.jpg"
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

setInterval(() => {
	location.reload();
}, 60000); // toutes les 60 secondes

fetch(eventEndpoint)
	.then(res => res.json())
	.then(data => {
		events = removeDuplicates(data);
		function getSLTime() {
			const now = new Date();
			const utc = now.getTime() + now.getTimezoneOffset() * 60000;
			const slOffset = -8; // GMT-8
			return new Date(utc + 3600000 * slOffset);
		}
		const now = getSLTime();
		const currentHour = now.getHours();

		const currentDate = now.toLocaleDateString("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long"
		});

		document.getElementById("currentDate").textContent = currentDate;

		const blockStart = 	currentHour >= 6 && currentHour < 12 ? 6 :
							currentHour >= 12 && currentHour < 18 ? 12 :
							currentHour >= 18 && currentHour < 24 ? 18 : 0;
		const blockEnd = 	blockStart + 6;
	
		events.forEach(event => {
			console.log("⏰ Event time:", event.time);
		});

		const filteredEvents = events.filter(event => {
			const [hour] = event.time.split(":").map(Number);
			console.log("🔍 Checking hour:", hour);
			return hour >= blockStart && hour < blockEnd;
		});

		renderEventList(filteredEvents);
		if (filteredEvents.length > 0) {
			selectEvent(filteredEvents[0]);
		} else {
			selectEvent(null);
		}
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
		const btn = document.createElement("button");
		btn.textContent = `🕒 ${event.time} - ${event.title}`;
		btn.onclick = () => selectEvent(event);
		list.appendChild(btn);
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

function stopBannerRotation() {
	clearInterval(bannerInterval);
	bannerInterval = null;
}

	// 🎯 Sélectionne un événement
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