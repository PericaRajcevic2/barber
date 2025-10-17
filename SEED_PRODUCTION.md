# 🌱 Seeding Production Database

## Problem:
Na Render-u vidiš "Nema dostupnih termina" jer **baza je prazna** - nema services ni working hours!

---

## ✅ Rješenje - Seedaj bazu preko API-ja:

### **Metoda 1: Koristi Browser/Postman**

#### 1. Prvo provjeri status baze:
```
GET https://tvoja-app.onrender.com/api/setup/status
```

**Response će pokazati:**
```json
{
  "database": "connected",
  "counts": {
    "services": 0,    ← PRAZNO!
    "workingHours": 0,  ← PRAZNO!
    "users": 0
  },
  "needsSeeding": true  ← Treba seedati!
}
```

#### 2. Seedaj bazu:
```
POST https://tvoja-app.onrender.com/api/setup/seed
```

**Response nakon seedanja:**
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

#### 3. Provjeri opet status:
```
GET https://tvoja-app.onrender.com/api/setup/status
```

**Sada bi trebalo:**
```json
{
  "counts": {
    "services": 4,     ✅
    "workingHours": 7,  ✅
    "users": 1
  },
  "needsSeeding": false,
  "data": {
    "services": [
      { "name": "Šišanje", "duration": 30, "price": 50 },
      { "name": "Brijanje", "duration": 20, "price": 30 },
      ...
    ],
    "workingHours": [
      { "dayOfWeek": 1, "dayName": "Ponedjeljak", "startTime": "09:00", "endTime": "17:00" },
      ...
    ]
  }
}
```

---

### **Metoda 2: Koristi cURL (Terminal)**

#### Windows PowerShell:
```powershell
# Check status
Invoke-RestMethod -Uri "https://tvoja-app.onrender.com/api/setup/status" -Method GET

# Seed database
Invoke-RestMethod -Uri "https://tvoja-app.onrender.com/api/setup/seed" -Method POST
```

#### Linux/Mac (bash):
```bash
# Check status
curl https://tvoja-app.onrender.com/api/setup/status

# Seed database
curl -X POST https://tvoja-app.onrender.com/api/setup/seed
```

---

### **Metoda 3: Koristi Postman**

1. **New Request** → POST
2. URL: `https://tvoja-app.onrender.com/api/setup/seed`
3. **Send**
4. Trebao bi vidjeti success message

---

## 🧪 Testiranje nakon seedanja:

### 1. Provjeri Services:
```
GET https://tvoja-app.onrender.com/api/services
```

**Trebao bi vidjeti:**
```json
[
  {
    "_id": "...",
    "name": "Šišanje",
    "duration": 30,
    "price": 50,
    "description": "Osnovno šišanje"
  },
  {
    "_id": "...",
    "name": "Brijanje",
    "duration": 20,
    "price": 30,
    "description": "Brijanje mašinicom ili žiletom"
  },
  ...
]
```

### 2. Provjeri Working Hours:
```
GET https://tvoja-app.onrender.com/api/working-hours
```

**Trebao bi vidjeti:**
```json
[
  {
    "dayOfWeek": 1,
    "dayName": "Ponedjeljak",
    "startTime": "09:00",
    "endTime": "17:00",
    "isWorking": true
  },
  ...
]
```

### 3. Provjeri Available Slots (za danas ili sutra):
```
GET https://tvoja-app.onrender.com/api/available-slots?date=2025-10-20
```

**Trebao bi vidjeti array sa vremenima:**
```json
["09:00", "09:30", "10:00", "10:30", ..., "16:30"]
```

### 4. Otvori Frontend:
```
https://tvoja-app.onrender.com/
```

**Sada bi trebalo:**
- ✅ Vidjetiš usluge u dropdown-u
- ✅ Kad odabereš datum, vidiš dostupne termine!
- ✅ Možeš kreirati appointment

---

## 🔐 Admin Login:

Nakon seedanja, možeš se loginovati kao admin:

```
URL: https://tvoja-app.onrender.com/admin
Username: admin
Password: admin123
```

**⚠️ VAŽNO:** Promijeni password odmah nakon prvog logina!

---

## 📋 Što `/api/setup/seed` kreira:

### Services:
1. **Šišanje** - 30 min - 50 KM
2. **Brijanje** - 20 min - 30 KM
3. **Šišanje i brijanje** - 50 min - 70 KM
4. **Pranje kose** - 15 min - 20 KM

### Working Hours:
- **Ponedjeljak-Petak:** 09:00 - 17:00
- **Subota:** 10:00 - 15:00
- **Nedjelja:** Zatvoreno

### Admin User:
- **Username:** admin
- **Password:** admin123

---

## ❌ Ako `/api/setup/seed` vraća error:

### "Podaci već postoje u bazi!"
```json
{
  "message": "Podaci već postoje u bazi!",
  "services": 4,
  "workingHours": 7
}
```

**Znači:** Baza je već seedana! ✅

Ako su podaci pogrešni, možeš ih urediti kroz Admin Dashboard.

---

## 🔄 Re-seeding (ako je potrebno):

Ako želiš **izbrisati** sve i seedati ponovo:

1. Otvori Admin Dashboard
2. Obriši sve services, working hours
3. Pozovi `/api/setup/seed` ponovo

---

## 🎯 Quick Fix - Jedan Command:

Kopiraj ovu URL u browser:
```
https://tvoja-app.onrender.com/api/setup/seed
```

Browseru će možda reći da skine JSON file - otvori ga, provjeri da piše `"success": true`!

---

## ✅ Gotovo!

Nakon seedanja, tvoja booking stranica bi trebala raditi perfektno! 🎉

---

**Javi mi ako vidiš neke errore u responsu!** 📸

---

**Made with ❤️ - Database Seeding Guide**
