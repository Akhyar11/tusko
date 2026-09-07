// ================================================================
// LIVE AUTO-RELOAD ENGINE FOR TUSKO PROTOTYPE
// Otomatis mendeteksi update dari GitHub & me-reload tanpa manual refresh
// ================================================================
(function() {
  let initialVersion = null;
  let isUpdating = false;

  async function checkForUpdates() {
    if (isUpdating) return;
    try {
      // Fetch version.json dengan timestamp agar selalu bypass browser cache
      const response = await fetch('version.json?_t=' + Date.now(), { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;

      const data = await response.json();
      const latestTimestamp = data.updatedAt;

      if (!initialVersion) {
        initialVersion = latestTimestamp;
        return;
      }

      // Jika timestamp di server berbeda dengan yang di browser, berarti ada push baru di GitHub!
      if (latestTimestamp !== initialVersion) {
        isUpdating = true;
        showToastNotification();
        setTimeout(() => {
          // Force reload dengan cache buster
          const cleanUrl = window.location.href.split('?')[0];
          window.location.href = cleanUrl + '?v=' + latestTimestamp;
        }, 1200);
      }
    } catch (e) {
      // Abaikan jika ada gangguan koneksi sesaat
    }
  }

  function showToastNotification() {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #10b981;
      color: #000000;
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: sans-serif;
      animation: pulse 1s infinite;
    `;
    toast.innerHTML = '<span>⚡ Desain Baru Di-push ke GitHub! Memperbarui Halaman...</span>';
    document.body.appendChild(toast);
  }

  // Cek setiap 4 detik
  setInterval(checkForUpdates, 4000);
  // Cek saat pertama kali load
  setTimeout(checkForUpdates, 1500);
})();
