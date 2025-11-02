// script.js — clean working version

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trackingForm");
  const resultDiv = document.getElementById("result");
  const loadingDiv = document.getElementById("loading");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const trackingId = document.getElementById("trackingId").value.trim();
    if (!trackingId) return alert("Please enter a tracking number.");

    resultDiv.innerHTML = "";
    loadingDiv.classList.remove("hidden");

    try {
      const res = await fetch(`/track/${trackingId}`);
      if (!res.ok) throw new Error("Shipment not found");

      const data = await res.json();
      loadingDiv.classList.add("hidden");

      resultDiv.innerHTML = `
        <div class="result-card">
          <h3>Tracking Details</h3>
          <p><strong>Tracking ID:</strong> ${data.tracking}</p>
          <p><strong>Sender:</strong> ${data.sender}</p>
          <p><strong>Receiver:</strong> ${data.receiver}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Security Level:</strong> ${data.securityLevel}</p>
          <p><strong>Last Updated:</strong> ${data.lastUpdated}</p>
        </div>
      `;
    } catch (err) {
      loadingDiv.classList.add("hidden");
      resultDiv.innerHTML = `<p class="error">❌ ${err.message}</p>`;
    }
  });
});