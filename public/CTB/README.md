# Crown The Barb — Luxury Hair Studio Website

## 📁 Directory Structure

```
crown-the-barb/
│
├── index.html              ← Main HTML file (entry point)
│
├── css/
│   └── style.css           ← All styles (responsive, animations, layout)
│
├── js/
│   └── main.js             ← Navigation, scroll effects, booking form, gallery
│
├── images/
│   ├── hero-bg.jpg         ← Hero background (dark, barbershop atmosphere)
│   ├── about-main.jpg      ← About section — large image (studio interior)
│   ├── about-accent.jpg    ← About section — small accent image (barber at work)
│   ├── barber-1.jpg        ← Team — Sibusiso Dlamini portrait
│   ├── barber-2.jpg        ← Team — Thabo Nkosi portrait
│   ├── barber-3.jpg        ← Team — Ayanda Mthembu portrait
│   ├── gallery-1.jpg       ← Gallery — fade cut
│   ├── gallery-2.jpg       ← Gallery — classic taper
│   ├── gallery-3.jpg       ← Gallery — beard sculpt
│   ├── gallery-4.jpg       ← Gallery — crown experience (wide)
│   ├── gallery-5.jpg       ← Gallery — sharp lines
│   └── gallery-6.jpg       ← Gallery — loc styling
│
└── README.md               ← This file
```

---

## 🖼️ Image Recommendations

All images should be **high quality, dark/moody in tone** to match the luxury aesthetic.

| File | Dimensions | Notes |
|------|-----------|-------|
| `hero-bg.jpg` | 1920×1080 or larger | Dark barbershop scene, barber at work |
| `about-main.jpg` | 900×700 | Warm interior shot of your studio |
| `about-accent.jpg` | 600×500 | Close-up of barber working |
| `barber-*.jpg` | 600×700 | Professional portrait, dark bg preferred |
| `gallery-*.jpg` | 800×800 | Before/after, cut showcase, styled shots |

**Free photo sources:** Unsplash.com, Pexels.com — search "luxury barbershop", "barber fade", "grooming studio"

---

## 🎨 Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Gold | `#C9A84C` | Primary accent, CTAs, highlights |
| Gold Light | `#E8CC82` | Hover states, hero italic text |
| Obsidian | `#0D0D0D` | Dark sections background |
| Charcoal | `#141414` | Cards, nav on scroll |
| Warm White | `#F7F4EF` | Light section backgrounds |

---

## 🔤 Fonts Used

All fonts load from **Google Fonts** (internet connection required):

- **Cormorant Garamond** — Headings, hero title, testimonials (luxury serif)
- **Tenor Sans** — Eyebrows, labels, nav links (refined display)
- **DM Sans** — Body copy, forms (clean modern)

---

## 🚀 How to Launch

### Option 1: Open Locally
Just open `index.html` in your browser. All fonts load from Google Fonts so you'll need internet access for full typography.

### Option 2: Live Server (Recommended for Dev)
```bash
# If you have Node.js installed:
npx serve .

# Or with Python:
python -m http.server 8000
```
Then visit `http://localhost:8000`

### Option 3: Deploy to the Web

**Netlify (easiest — free):**
1. Go to netlify.com → "Add new site" → "Deploy manually"
2. Drag your entire `crown-the-barb/` folder into the deploy zone
3. Get an instant live URL

**Vercel:**
```bash
npm i -g vercel
cd crown-the-barb
vercel
```

---

## ✏️ Customisation Checklist

- [ ] Replace all `images/` files with your real photos
- [ ] Update contact details in the booking section and footer
- [ ] Change "123 Umhlanga Ridge" to your real address
- [ ] Update phone number: `+27 31 000 0000`
- [ ] Update email: `hello@crownthebarb.co.za`
- [ ] Update prices in the Services section to match your actual pricing
- [ ] Update team member names, roles, and bios
- [ ] Link social media icons (Instagram, Facebook, TikTok) in the footer
- [ ] Connect the booking form to a real service (see below)

---

## 📬 Connecting the Booking Form

The form currently shows a success message locally. To actually receive bookings:

**Option A — Formspree (free):**
1. Create account at formspree.io
2. Create a form → copy your endpoint URL
3. In `index.html`, change:
   ```html
   <form class="booking__form" onsubmit="handleBooking(event)">
   ```
   to:
   ```html
   <form class="booking__form" action="https://formspree.io/f/YOUR_ID" method="POST">
   ```
   Remove the `onsubmit` handler and delete the JS `handleBooking` function.

**Option B — Netlify Forms (if hosted on Netlify):**
Add `netlify` attribute to the form tag:
```html
<form class="booking__form" name="booking" netlify>
```

---

## 📱 Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| Desktop (>1024px) | Full 2-column layouts, 3-column grid |
| Tablet (768–1024px) | 2-column services, stacked about section |
| Mobile (<768px) | Single column, hamburger menu |
| Small mobile (<480px) | Full-width buttons, single gallery column |

---

Built with care for **Crown The Barb Hair Studio · Durban, KZN**
