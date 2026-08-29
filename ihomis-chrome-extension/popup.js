chrome.storage.local.get(['last_sync'], (result) => {
  const sync = result.last_sync;
  if (sync && sync.success) {
    document.getElementById('syncStatus').innerText = `✓ Synced ${sync.count} ${sync.module || 'Patients'}`;
    document.getElementById('syncTime').innerText = `Last updated: ${sync.timestamp}`;
  } else {
    document.getElementById('syncStatus').innerText = 'Ready & Waiting for iHOMIS tab';
  }
});
