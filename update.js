// Load events from JSON and display based on current 6h block
fetch("events.json")
	.then((response) => response.json())
	.then((events) => {
		const now = new Date();
		const currentHour = now.getHours();
		const currentDate = now.toLocaleDateString("en-US", {
			weekday: "long",
			day: "numeric",
			month: "long",
		});

		// Update date display
		document.getElementById("currentDate").textContent = currentDate;

		// Determine current 6h block
		let blockStart = 0;
		if (currentHour >= 6 && currentHour < 12) blockStart = 6;
		else if (currentHour >= 12 && currentHour < 18) blockStart = 12;
		else if (currentHour >= 18 && currentHour < 24) blockStart = 18;
		else blockStart = 0;

		const blockEnd = blockStart + 6;

		// Filter events in current block
		const filteredEvents = events.filter((event) => {
		const [hour] = event.time.split(":").map(Number);
		return hour >= blockStart && hour < blockEnd;
    });

    // Display event buttons
	const eventList = document.querySelector(".event-list");
    eventList.innerHTML = ""; // Clear existing

    filteredEvents.forEach((event, index) => {
		const btn = document.createElement("button");
		btn.textContent = `🕒 ${event.time} - ${event.title}`;
		btn.onclick = () => selectEvent(event);
		eventList.appendChild(btn);
    });

    // Default: show first event
    if (filteredEvents.length > 0) {
		selectEvent(filteredEvents[0]);
    }
 });

// Update flyer, host, location
function selectEvent(event) {
	document.getElementById("eventHost").textContent = event.host || "—";
	document.getElementById("eventLocation").textContent = event.location || "—";
	document.getElementById("eventBanner").src = event.image?.value || "https://via.placeholder.com/1024x300?text=RP+Flyer";
}
