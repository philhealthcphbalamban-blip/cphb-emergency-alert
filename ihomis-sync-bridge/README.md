# 🏥 CPHB iHOMIS Plus Realtime Cloud Auto-Sync Bridge

This daemon runs directly on the **Hospital Local Area Network (LAN) Server or IT PC** to automatically synchronize live active encounters from **iHOMIS Plus** (`/Admission`, `/Emergency`, `/Outpatient`) to the **CPHB Emergency Alert Cloud App** hosted on Vercel (`https://cphb-emergency-alert.vercel.app`).

---

## 🚀 Quick Setup (1 Minute)

1. **Open the folder** `ihomis-sync-bridge/` on the Hospital Server or IT PC.
2. **Double-click `start-sync.bat`**.
   * It will automatically verify Node.js and start syncing every 60 seconds.
3. Whenever an updated patient census export is saved or dropped into `ihomis_exports/`, the daemon automatically parses and uploads it to the Cloud API instantly!

---

## ⚙️ Configuration (`config.json`)

```json
{
  "hospital_name": "Cebu Provincial Hospital - Balamban (CPHB)",
  "cloud_api_url": "https://cphb-emergency-alert.vercel.app/api/ihomis/patients",
  "sync_interval_seconds": 60,
  "csv_watch_folder": {
    "enabled": true,
    "watch_directory": "./ihomis_exports"
  }
}
```

* **`sync_interval_seconds`**: How often the daemon syncs (Default: `60` seconds).
* **`cloud_api_url`**: The live Vercel cloud API endpoint.
* **`ihomis_exports/`**: The folder where iHOMIS exports or scheduled reports are stored.

---

## 🔄 What It Accomplishes:
* **100% Fully Automated**: No manual copying or intervention needed by nurses or doctors.
* **Instant Ward & ER Matching**: Code Blue and emergency alerts automatically lookup real-time patient names and ward bed numbers.
* **Multi-Device Live Synchronization**: All cellphones, laptops, and TV monitors display the exact same up-to-date hospital census!
