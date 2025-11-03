document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trackingForm");
  const input = document.getElementById("trackingId");
  const result = document.getElementById("result");
  const loading = document.getElementById("loading");

  const statusSteps = ["Processing", "In Transit", "Out for Delivery", "Delivered"];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const trackingId = input.value.trim();
    result.innerHTML = "⏳ Checking shipment...";

    if (!trackingId) {
      result.innerHTML = "<p style='color:red;'>Please enter a tracking number.</p>";
      return;
    }

    try {
      const response = await fetch(`/track/${trackingId}`);
      if (!response.ok) {
        result.innerHTML = "<p style='color:red;'>Shipment not found ❌</p>";
        return;
      }

      const shipment = await response.json();

      // find current progress step
      const currentStep = statusSteps.findIndex(
        step => step.toLowerCase() === shipment.status.toLowerCase()
      );

      // build progress bar
      const progressHTML = `
        <div class="progress-container">
          ${statusSteps.map((step, i) => `
            <div class="progress-step ${i <= currentStep ? 'active' : ''}">
              <span>${step}</span>
            </div>
          `).join('')}
        </div>
      `;

      // full result card
      result.innerHTML = `
        <div class="result-card">
          <h3>Shipment Found ✅</h3>
          <p><strong>Tracking Number:</strong> ${shipment.tracking}</p>
          <p><strong>Sender:</strong> ${shipment.sender}</p>
          <p><strong>Receiver:</strong> ${shipment.receiver}</p>
          <p><strong>Status:</strong> ${shipment.status}</p>
          <p><strong>Security Level:</strong> ${shipment.securityLevel}</p>
          ${shipment.lastUpdated ? `<p><strong>Last Updated:</strong> ${shipment.lastUpdated}</p>` : ""}
          <h4>Progress</h4>
          ${progressHTML}
        </div>
      `;
    } catch (error) {
      result.innerHTML = "<p style='color:red;'>⚠️ Unable to connect to the tracking server.</p>";
    }
  });
});