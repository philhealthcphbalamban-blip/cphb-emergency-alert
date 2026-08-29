const VERCEL_API = 'https://cphb-emergency-alert.vercel.app/api/ihomis/patients';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_PATIENTS_PAYLOAD') {
    fetch(VERCEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.payload),
    })
      .then(res => res.json())
      .then(data => {
        chrome.storage.local.set({
          last_sync: {
            timestamp: new Date().toLocaleTimeString(),
            count: data.count || message.payload.patients.length,
            module: message.payload.module,
            success: true,
          }
        });
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('Background Sync Error:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // async response
  }
});
