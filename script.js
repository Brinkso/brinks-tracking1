document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trackingForm");
  const trackingId = document.getElementById("trackingId");
  const result = document.getElementById("result");
  const loading = document.getElementById("loading");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = trackingId.value.trim();
    if (!id) return alert("Please enter a tracking number.");

    loading.classList.remove("hidden");
    result.innerHTML = "";

    try {
      const res = await fetch(`/track/${id}`);
      const data = await res.json();

      if (res.ok) {
        result.innerHTML = `
          <h3>Shipment Found</h3>
          <p><strong>Tracking:</strong> ${data.tracking}</p>
          <p><strong>Sender:</strong> ${data.sender}</p>
          <p><strong>Receiver:</strong> ${data.receiver}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Security Level:</strong> ${data.securityLevel}</p>
          <p><strong>Last Updated:</strong> ${data.lastUpdated}</p>
        `;
      } else {
        result.innerHTML = `<p class="error">❌ ${data.error || "Shipment not found"}</p>`;
      }
    } catch (err) {
      console.error(err);
      result.innerHTML = `<p class="error">⚠️ Error connecting to server.</p>`;
    } finally {
      loading.classList.add("hidden");
    }
  });
});