# 🔧 Render Deploy Fix - Frontend nije vidljiv

## Problem:
Link otvara samo API JSON response `{"message":"Barber Booking API radi!"}` umjesto React frontend-a.

## Razlog:
React frontend nije pravilno buildovan tokom deploya na Renderu.

---

## ✅ Rješenje - Podesi Build Command na Renderu:

### 1. Idi na Render Dashboard:
https://dashboard.render.com/

### 2. Klikni na svoj Web Service (barber-booking)

### 3. Klikni **Settings** (lijevi meni)

### 4. Scroll do **Build & Deploy** sekcije

### 5. Uredi **Build Command**:

#### Stari (možda je prazan ili ima samo `npm install`):
```
npm install
```

#### NOVI (kopiraj ovo):
```
npm install && cd client && npm install && npm run build && cd ..
```

**Objašnjenje:**
- `npm install` - instalira server dependencies
- `cd client` - ide u client folder
- `npm install` - instalira React dependencies  
- `npm run build` - builda React app u `client/dist/`
- `cd ..` - vraća se u server folder

### 6. **Start Command** treba biti:
```
npm start
```

### 7. **Root Directory**:
```
server
```
(ili ostavi prazno ako je projekat u root-u)

### 8. Environment Variables - DODAJ:
```
NODE_ENV = production
```

### 9. Klikni **Save Changes**

### 10. Render će automatski **re-deployati** app (traje 3-5 min)

---

## 📋 Provjeri Build Logs:

Dok se deploya, klikni **Logs** i provjeri:

**Trebao bi vidjeti:**
```
📦 Installing client dependencies...
⚛️  Building React app...
✓ built in 30s
✅ Build complete!
```

**Ako ne vidiš ovo**, build nije prošao!

---

## 🧪 Testiranje:

Nakon što deploy završi:

### 1. Otvori link: `https://tvoja-app.onrender.com`
**Trebao bi vidjeti:**
- ✅ React frontend sa kalendarom
- ✅ "REZERVIRAJTE TERMIN" title
- ✅ Barber shop theme (brown/gold)

### 2. Testiraj API: `https://tvoja-app.onrender.com/api/health`
**Trebao bi vidjeti:**
```json
{
  "message": "Barber Booking API radi!",
  "status": "healthy",
  "timestamp": "2025-10-17T..."
}
```

### 3. Testiraj Admin: `https://tvoja-app.onrender.com/admin`
**Trebao bi vidjeti:**
- ✅ Admin login page

---

## 🔍 Ako OPET ne radi:

### Opcija 1 - Ručni Trigger Deploy:
1. Dashboard → **Manual Deploy**
2. Klikni **Clear build cache & deploy**

### Opcija 2 - Provjeri folder strukturu:
U Render Logs, provjeri da li postoji:
```
ls client/dist/
```
Trebao bi vidjeti:
- index.html
- assets/
- vite.svg

### Opcija 3 - Provjeri NODE_ENV:
U Environment variables, provjeri:
```
NODE_ENV = production
```

### Opcija 4 - Lokalno testiranje:
```powershell
cd server
npm install
cd client
npm install
npm run build
cd ..
$env:NODE_ENV="production"
npm start
```
Otvori: http://localhost:5000

---

## 📝 Šta je promijenjeno u kodu:

### `server.js`:
- ✅ API rute PRIJE static servinga
- ✅ Dodao `/api/health` endpoint
- ✅ Production check za serving static files

### `package.json`:
- ✅ Dodao `build` script
- ✅ Dodao helper scripts

### Novi files:
- ✅ `render.yaml` - Render config
- ✅ `build.sh` - Build script

---

## 🎯 Nakon ovoga:

**Root URL** → React Frontend
```
https://tvoja-app.onrender.com/
→ prikazuje booking stranicu
```

**API Endpoints** → JSON responses
```
https://tvoja-app.onrender.com/api/health
→ {"message":"Barber Booking API radi!"}

https://tvoja-app.onrender.com/api/services
→ [lista usluga]
```

**Admin Panel** → React Frontend
```
https://tvoja-app.onrender.com/admin
→ admin login page
```

---

**Ako OPET vidiš samo JSON, javi mi screenshot Render Build Logs-a!** 🔍

---

**Made with ❤️ - Deploy Troubleshooting**
