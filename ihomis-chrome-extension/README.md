# 🏥 CPHB iHOMIS+ Chrome Extension (Developer Mode)

This Chrome Extension automatically monitors live encounters inside **iHOMIS Plus** (`/Emergency`, `/Admission`, `/Outpatient`) and continuously pushes them in real-time to the **Vercel Cloud Emergency Alert System** (`https://cphb-emergency-alert.vercel.app`).

---

## 🚀 How to Install in 15 Seconds (Developer Mode):

1. Open Google Chrome and go to:
   ```text
   chrome://extensions
   ```
2. In the top right corner, **turn ON `Developer mode`**.
3. Click the **`Load unpacked`** button in the top left corner.
4. Select the folder:
   ```text
   C:\Users\cphbn\.gemini\antigravity\scratch\hospital-emergency-alert\ihomis-chrome-extension
   ```
5. **THAT'S IT!** 🎉
   * Open or refresh your iHOMIS+ tab (`https://ihomis-plus.cphb.local/Emergency`).
   * The extension will automatically extract all live encounters and sync them to Vercel every 10 seconds!
