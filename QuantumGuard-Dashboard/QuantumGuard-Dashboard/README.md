# QuantumGuard – Farmer Dashboard

A blockchain-based digital identity and farmer welfare dashboard built for Indian farmers.

---

## 📁 Project Structure

```
QuantumGuard-Dashboard/
├── index.html          ← Main HTML file (open this)
├── css/
│   └── styles.css      ← All styles
├── js/
│   └── app.js          ← All JavaScript logic
├── .vscode/
│   ├── settings.json   ← Live Server config
│   └── extensions.json ← Recommended extensions
└── README.md
```

---

## 🚀 How to Run in VS Code

### Method 1 — Live Server (Recommended)

1. Open VS Code
2. Open the `QuantumGuard-Dashboard` folder:
   - `File → Open Folder → select QuantumGuard-Dashboard`
3. Install the **Live Server** extension:
   - Press `Ctrl+Shift+X` (Extensions panel)
   - Search **"Live Server"** by Ritwick Dey → Install
4. Right-click `index.html` in the file explorer
5. Select **"Open with Live Server"**
6. The dashboard opens at `http://127.0.0.1:5500`

### Method 2 — Direct Browser Open

1. Navigate to the `QuantumGuard-Dashboard` folder in your file explorer
2. Double-click `index.html`
3. It will open directly in your default browser

> ⚠️ **Note:** For full localStorage multi-user support, use Live Server (Method 1).  
> Some browsers restrict localStorage on `file://` URLs.

---

## 🌐 Internet Required For

- Google Fonts (Nunito & Poppins) — for typography
- QRCode.js CDN — for QR code generation on the Identity Card page

If you are offline, the dashboard still works but fonts will fall back to system defaults and QR codes won't generate.

---

## 👤 Multi-User Flow

1. Click **Register** → complete the 4-step form → lands on Dashboard
2. Click **Logout** → go back to Landing
3. Click **Login** → enter a **different** phone number → Register a new user
4. Each user's data is saved separately in browser localStorage

---

## ✅ Features

- 4-step farmer registration (Personal → Address → Land → Financial)
- Multi-user support (each phone number = separate account)
- Login validates phone (10 digits) + PIN (4 digits)
- Profile page shows all registered user details
- Document upload with IPFS simulation
- Blockchain identity page (per-user hash + farmer ID)
- Loan eligibility checker
- Government scheme listings
- QR Identity Card generation
- Validation status tracker
- Edit profile modal
- Toast notifications

---

## 🛠️ Tech Stack

- Pure HTML5 + CSS3 + Vanilla JavaScript (no frameworks)
- Google Fonts CDN
- QRCode.js (via CDN)
- Browser localStorage for multi-user persistence

---

## 📝 Notes

- No backend or server required — fully client-side
- Data persists in your browser's localStorage
- To reset all data: open browser DevTools → Application → localStorage → clear `qg_all_farmers`
