// Function to show date and time inside the small glowing box
function showDateTime() {
    const dateTimeElement = document.getElementById('glowingBox'); // Box ka ID le rahe hain
    dateTimeElement.style.display = 'flex';
    dateTimeElement.style.alignItems = 'center';
    dateTimeElement.style.justifyContent = 'center';
    dateTimeElement.style.fontSize = '12px';
    dateTimeElement.style.color = '#0ff';
    dateTimeElement.style.fontFamily = 'Arial, sans-serif';

    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleTimeString();
        dateTimeElement.innerHTML = dateTimeString;
    }

    setInterval(updateDateTime, 1000);
    updateDateTime();
}

// Call the function when the page loads
window.onload = showDateTime;
