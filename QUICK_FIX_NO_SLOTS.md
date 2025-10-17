# 🚨 BRZO RJEŠENJE - "Nema dostupnih termina"

## Problem:
Stranica radi, ali za SVAKI datum piše "Nema dostupnih termina"

## Razlog:
**Baza je prazna** - nema services ni working hours!

---

## ⚡ RJEŠENJE U 3 KORAKA:

### 1️⃣ Push novi kod na GitHub:
```powershell
cd c:\Users\Windows\Desktop\barber
git add .
git commit -m "Add: Setup API for seeding production database"
git push origin main
```

Render će automatski re-deployati (2-3 min).

---

### 2️⃣ Čekaj da Render završi deploy

Provjeri **Logs** na Renderu - trebao bi vidjeti:
```
✅ Deploy successful
✅ Server running on port...
```

---

### 3️⃣ Seedaj bazu - otvori u browseru:

```
https://tvoja-app.onrender.com/api/setup/seed
```

Browser će možda pokušati skinuti JSON file - **otvori ga**, trebao bi vidjeti:
```json
{
  "success": true,
  "message": "Baza uspješno seedana!",
  "data": {
    "services": 4,
    "workingHours": 7,
    "adminCreated": true
  }
}
```

---

## ✅ Testiraj:

### 1. Refresh homepage:
```
https://tvoja-app.onrender.com/
```

### 2. Odaberi datum (npr. sutra)

### 3. **Trebao bi vidjeti dostupne termine!** 🎉
```
09:00  09:30  10:00  10:30  ...
```

---

## 🔍 Debug (ako opet ne radi):

### Provjeri Status:
```
https://tvoja-app.onrender.com/api/setup/status
```

**Trebao bi vidjeti:**
```json
{
  "counts": {
    "services": 4,      ← Mora biti > 0
    "workingHours": 7   ← Mora biti > 0
  },
  "needsSeeding": false
}
```

### Ako vidiš `"services": 0`:
Znači seed nije prošao. Pokušaj ponovo:
```
https://tvoja-app.onrender.com/api/setup/seed
```

---

## 📝 Kreano:

- ✅ `/api/setup/seed` - Seedanje baze
- ✅ `/api/setup/status` - Check database status
- ✅ Services (4 usluge)
- ✅ Working Hours (Pon-Sub)
- ✅ Admin user (username: admin, password: admin123)

---

**Otvori [SEED_PRODUCTION.md](SEED_PRODUCTION.md) za detaljnije instrukcije!**

**Javi mi ako radi!** 🚀

---

**Made with ❤️**
