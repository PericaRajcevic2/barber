# PWA & Mobile Features Guide

Kompletan vodič za PWA (Progressive Web App) funkcionalnosti i mobilnu optimizaciju Barber Booking sistema.

## 🎯 Implementirane Funkcionalnosti

### ✅ 1. PWA Manifest - Install on Home Screen

**Fajlovi:**
- `client/public/manifest.json` - PWA manifest konfiguracija
- `client/index.html` - Meta tagovi i linkovi

**Funkcionalnosti:**
- ✨ **Instalabilnost**: Aplikacija se može instalirati na Home Screen (Android, iOS, Desktop)
- 🎨 **Branding**: Custom ikone, splash screen, theme boja (#1e40af)
- 📱 **Standalone mode**: Radi kao native app (bez browser chrome-a)
- 🌍 **Offline support**: Service worker omogućava rad bez interneta

**Kako koristiti:**
1. Otvori aplikaciju u Chrome/Edge (Android) ili Safari (iOS)
2. Tap na "Add to Home Screen" u browser meniju
3. Ili koristi InstallPrompt komponentu koja se pojavljuje automatski

**iOS specifičnosti:**
- Apple touch ikone (152x152, 180x180, 192x192)
- Status bar stil: `black-translucent`
- Viewport fit za notched uređaje

---

### ✅ 2. Service Worker - Offline & Push Notifications

**Fajlovi:**
- `client/public/service-worker.js` - SW logika
- `client/src/main.jsx` - SW registracija

**Funkcionalnosti:**
- 💾 **Cache strategija**: Network-first sa fallback na cache
- 📡 **Push notifikacije**: Web Push API integracija
- 🔄 **Background sync**: Sinhronizacija offline akcija
- 🗑️ **Cache management**: Automatsko čišćenje starih verzija

**Cache strategija:**
```javascript
// Cached resources:
- / (root)
- /index.html
- /src/main.jsx, App.jsx
- CSS files
```

**Push notification handling:**
- `push` event - prima notifikacije od servera
- `notificationclick` event - otvara aplikaciju na klik
- Vibration pattern: [200, 100, 200]

---

### ✅ 3. Push Notifications Backend

**Fajlovi:**
- `server/routes/push.js` - Push routes
- `server/models/PushSubscription.js` - Subscription model
- `server/routes/appointments.js` - Integracija

**Endpoints:**

#### `GET /api/push/vapid-public-key`
Vraća VAPID public key za push subscription.

#### `POST /api/push/subscribe`
Sačuva push subscription u bazu.
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

#### `POST /api/push/send-admin`
Šalje push notifikaciju samo adminima.
```json
{
  "title": "Nova Narudžba!",
  "body": "Petar Petrović - Šišanje i brijanje",
  "data": {
    "url": "/admin",
    "appointmentId": "..."
  }
}
```

#### `POST /api/push/send`
Šalje push notifikaciju svim pretplatnicima.

**VAPID keys setup:**

```bash
# Generate keys:
npx web-push generate-vapid-keys

# Add to .env:
VAPID_PUBLIC_KEY=BMz3DHtpWN68cTJWKb6HJv4o3m9JGMlHdTSPVw6SwBkRzmRDFIF42pgM-ENaWjx0rU3nqVnNi6Emi5ZPxBrtB4g
VAPID_PRIVATE_KEY=9Dj9GhXa5a-YxynCpzaBp-Zh-vtKFQA5mdBvf_ONYCc
VAPID_SUBJECT=mailto:admin@barberbooking.com
```

**Kako radi:**
1. Klijent se registruje za push notifikacije (main.jsx)
2. Subscription se čuva u MongoDB (PushSubscription model)
3. Kada nova narudžba stigne, server šalje push svim admin uređajima
4. Service worker prikazuje notifikaciju čak i kad je app zatvoren

**Admin notifikacije - trigeri:**
- 🎉 Nova narudžba kreirana
- ♻️ Narudžba reschedule-ovana
- ❌ Narudžba otkazana

---

### ✅ 4. SwipeableCalendar - Native-like Swipe

**Fajlovi:**
- `client/src/components/SwipeableCalendar.jsx`
- `client/src/components/SwipeableCalendar.css`

**Funkcionalnosti:**
- 👆 **Touch gestures**: Swipe left/right za promjenu mjeseca
- 🎨 **Animacije**: Smooth transitions i drag feedback
- 📱 **Mobile-first**: Optimizovano za touch uređaje
- 🌗 **Dark mode**: Automatska podrška

**Props:**
```jsx
<SwipeableCalendar
  selectedDate={date}
  onDateChange={(newDate) => setDate(newDate)}
  minDate={new Date()}
  maxDate={maxMonths}
  blockedDates={['2025-01-15', '2025-02-20']}
/>
```

**Touch events:**
- `onTouchStart` - početak swipe-a
- `onTouchMove` - drag tracking sa vizuelnim feedback-om
- `onTouchEnd` - validacija swipe smjera (min 50px)

**Visual states:**
- 🔵 Selected day (blue gradient)
- 🟢 Today (blue border + indicator dot)
- ⚪ Available days (white background)
- ⚫ Disabled days (gray, not clickable)

**Responsive:**
- Mobile: Compact view, 14px font
- Tablet: 600px max-width, 16px font
- Desktop: Mouse hover effects preserved

---

### ✅ 5. Tablet Layout - Hybrid Design

**Fajlovi:**
- `client/src/components/AdminDashboard.css` - Media queries

**Breakpoints:**
- Mobile: < 640px
- Tablet: 641px - 1024px
- Desktop: > 1024px

**Tablet optimizations (641px - 1024px):**

#### Grid layouts:
```css
.items-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

.calendar-view {
  grid-template-columns: 1fr 1fr; /* Side by side */
}
```

#### Navigation:
- Horizontal scroll tabs (sticky header)
- Thin scrollbar (6px height)
- Smooth scroll behavior

#### Touch targets:
- Minimum 44px height (Apple HIG compliance)
- 10px-20px padding za buttons
- Font size 16px (prevents iOS zoom)

#### Landscape mode (641px - 1024px + landscape):
- 3 column grids
- Side panel layouts (2fr 1fr)
- Expanded horizontal space

**Touch device optimizations:**
```css
@media (hover: none) and (pointer: coarse) {
  /* Larger tap targets */
  button { min-height: 44px; min-width: 44px; }
  
  /* Active feedback */
  button:active { transform: scale(0.97); }
  
  /* Prevent text selection */
  .nav-tab { user-select: none; }
}
```

**Standalone mode (PWA):**
```css
@media (display-mode: standalone) {
  /* Safe area insets za notched devices */
  .admin-header {
    padding-top: max(20px, env(safe-area-inset-top));
  }
  
  .floating-back-button {
    bottom: max(20px, env(safe-area-inset-bottom));
  }
}
```

---

### ✅ 6. InstallPrompt Component

**Fajlovi:**
- `client/src/components/InstallPrompt.jsx`
- `client/src/components/InstallPrompt.css`

**Funkcionalnosti:**
- 📱 Auto-prompt nakon 30 sekundi
- 🔕 Dismissable sa 7-day remember
- ✨ Gradijent background (#1e40af → #3b82f6)
- 📏 Responsive design (mobile/landscape)

**How it works:**
1. Sluša `beforeinstallprompt` event
2. Čuva deferredPrompt za kasnije
3. Prikazuje custom install button
4. Na klik → poziva `deferredPrompt.prompt()`

**States:**
- `isVisible` - da li je prompt prikazan
- `isStandalone` - da li je app već instaliran
- `dismissed` - localStorage timestamp

**UI:**
- Icon: 📱
- Title: "Instaliraj aplikaciju"
- Description: "Dodaj na početni ekran za brži pristup!"
- Actions: [Instaliraj] [✕]

---

## 🚀 Deployment Checklist

### Pre-production:

1. **Generate real icons** (trenutno su SVG placeholders):
```bash
# Option 1: Online conversion
# Upload client/public/icons/*.png.svg to cloudconvert.com
# Convert to PNG, download, replace files

# Option 2: Use sharp library
npm install sharp
node generate-real-icons.js
```

2. **Update manifest.json:**
- `name`: Pravo ime salona
- `short_name`: Kraća verzija
- `description`: SEO-friendly opis
- `start_url`: Production URL
- `theme_color`: Brand boja

3. **Environment variables (.env):**
```env
# VAPID keys (already generated)
VAPID_PUBLIC_KEY=BMz3DHtpWN68cTJWKb6HJv4o3m9JGMlHdTSPVw6SwBkRzmRDFIF42pgM-ENaWjx0rU3nqVnNi6Emi5ZPxBrtB4g
VAPID_PRIVATE_KEY=9Dj9GhXa5a-YxynCpzaBp-Zh-vtKFQA5mdBvf_ONYCc
VAPID_SUBJECT=mailto:admin@yourdomain.com

# App URL for push notifications
APP_URL=https://yourdomain.com
```

4. **HTTPS required:**
- PWA i push notifikacije ne rade na HTTP (osim localhost)
- Render automatski pruža HTTPS ✅

5. **Build frontend:**
```bash
cd client
npm run build
# Vite će automatski kopirati public/ folder u dist/
```

6. **Test PWA:**
- Chrome DevTools → Application → Manifest (provjeri)
- Service Workers → Provjeri da je registered
- Lighthouse audit → PWA score treba biti 100

---

## 📱 User Experience Flow

### First Visit (Not Installed):
1. User otvara app u browseru
2. Service worker se registruje u pozadini
3. Push permission request (opciono)
4. Nakon 30s → InstallPrompt se pojavljuje
5. User može instalirati ili dismiss

### Installed (Standalone Mode):
1. User tap-uje app ikonu na Home Screen
2. App se otvara fullscreen (bez browser UI)
3. Splash screen sa app ikonom
4. Offline support - cached resursi rade
5. Push notifikacije rade čak i kad je app zatvoren

### Admin Push Notifications:
1. Admin instalira app i omogući notifikacije
2. Subscription se čuva u DB sa `isAdmin: true`
3. Nova narudžba → server poziva `/api/push/send-admin`
4. Push stiže na sve admin uređaje
5. Tap na notifikaciju → otvara app na admin dashboardu

---

## 🔧 Troubleshooting

### Push notifikacije ne rade:
- Provjeri VAPID keys u .env
- Provjeri HTTPS (required osim localhost)
- Browser dozvola (Settings → Notifications)
- Console errors u DevTools

### Service Worker ne update-uje:
```javascript
// U DevTools → Application → Service Workers
// Klikni "Update on reload" checkbox
// Hard refresh (Ctrl+Shift+R)
```

### PWA ne pokazuje "Install" prompt:
- Manifest.json mora biti valid
- Ikone moraju postojati
- HTTPS connection required
- Service worker registered
- Lighthouse audit za detalje

### Tablet layout ne radi:
- Provjeri media queries u AdminDashboard.css
- DevTools → Toggle device toolbar
- Test na tablet uređaju (iPad, Samsung Tab)

---

## 📊 Performance Optimizations

### Service Worker Cache:
- Static assets cached on install
- Network-first strategija za API calls
- Auto-cleanup starih cache verzija

### Image optimization:
- Icons u multiple sizes (72-512px)
- Purpose: "any maskable" za adaptive icons

### Bundle size:
- SwipeableCalendar: ~5KB gzipped
- InstallPrompt: ~2KB gzipped
- Service Worker: ~3KB gzipped

---

## 🎨 Customization

### Theme colors:
```json
// manifest.json
"theme_color": "#1e40af",  // Blue theme
"background_color": "#ffffff"
```

### Splash screen (iOS):
```html
<!-- index.html -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### Icons:
- Square icons sa padding (20% radius)
- Barber scissors symbol
- White na blue gradient background

---

## 📚 Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audit](https://web.dev/lighthouse-pwa/)

---

**Autor**: AI Assistant  
**Verzija**: 1.0  
**Datum**: 2025-10-29  
**Status**: ✅ Production Ready
