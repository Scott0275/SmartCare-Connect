# SmartCare Landing Website — Navigation & Links Reference

## ✅ Navigation Bar (All Pages)

**Logo:** Links to `index.html`

**Menu Items:**
```
| Company         | → company.html    |
| Our Solution    | → solution.html   |
| Hospitals       | → clients.html    |
| Book Demo (CTA) | → book.html       |
```

**Status by Page:**
- `index.html` — Logo clickable, nav links to other pages
- `company.html` — Active: "Company" highlighted
- `solution.html` — Active: "Our Solution" highlighted
- `clients.html` — Active: "Hospitals We Serve" highlighted
- `book.html` — Active: "Book Demo" highlighted

---

## 📍 Page-Specific Internal Links

### **index.html (Home)**

**Header CTA:**
- "Book a Demo" button → `book.html`

**In-Page Anchors (if needed):**
- `#how-it-works` — How It Works section
- `#features` — Features section
- `#who-its-for` — Who It's For section

**Footer Links:**
```
PRODUCT
- Our Solution    → solution.html
- Features        → index.html#features
- How It Works    → index.html#how-it-works

COMPANY
- About Us        → company.html
- Hospitals       → clients.html
- Book Demo       → book.html

LEGAL
- Privacy Policy  → #privacy (placeholder)
- Terms           → #terms (placeholder)
- HIPAA           → #hipaa (placeholder)
```

---

### **company.html (About)**

**CTA Buttons:**
- "Schedule a Demo" (bottom) → `book.html`

**Footer Links:**
```
Same as index.html (full navigation)
```

---

### **solution.html (Our Solution)**

**CTA Buttons:**
- "Schedule a Demo" (bottom) → `book.html`

**Footer Links:**
```
Same as index.html (full navigation)
```

---

### **clients.html (Hospitals We Serve)**

**CTA Buttons:**
- "Schedule Your Demo Today" (partnership section) → `book.html`
- "Book a Demo" (bottom CTA) → `book.html`

**Client Cards:**
- Each hospital card highlights one benefit
- No links within cards (informational only)

**Footer Links:**
```
Same as index.html (full navigation)
```

---

### **book.html (Book Demo)**

**Form Section:**
- Form submits to backend (no page redirect)
- Success state: "Demo scheduled!" message displays
- No navigation away from page

**Success Stories:**
- "Peace Healthcare" → informational (no link)
- "Talent Hospital" → informational (no link)
- "Mainland Care" → informational (no link)

**Footer Links:**
```
Same as index.html (full navigation)
```

---

## 🔗 CTA (Call-To-Action) Links Summary

| Button Text | Location | Target | Page |
|---|---|---|---|
| Book a Demo | Hero section | book.html | index.html |
| Schedule a Demo | Bottom CTA | book.html | company.html |
| Schedule a Demo | Bottom CTA | book.html | solution.html |
| Schedule Your Demo Today | Partnership section | book.html | clients.html |
| Book a Demo | Bottom CTA | book.html | clients.html |
| Form Submit | Form submission | Backend API | book.html |

---

## 📧 Form Submissions

### **Email Newsletter (index.html - if kept)**
- Form: `.email-form`
- Submission: POST to AWS Amplify Lambda
- Response: Displayed on same page

### **Demo Booking (book.html)**
- Form: `#demoForm`
- Submission: POST to AWS Amplify Lambda
- Response: Success message, page stays on book.html

---

## 🎨 Navigation Styling

### **Active State**
- Current page nav item has class `active`
- CSS: Color changes to `var(--primary-blue)` (#0066cc)
- Desktop: Underline appears below active link
- Mobile: Text color changes on active link

### **CTA Button Styling**
- Class: `.nav-cta`
- Color: White text on blue background (#0066cc)
- Hover: Darker blue (#004a99)
- Mobile: Full styling maintained

---

## 📱 Mobile Navigation

### **Mobile Menu Toggle**
- Button: `.mobile-menu-btn` (hamburger icon)
- Behavior: Clicks toggle `.nav-links` display
- Animation: Hamburger → X transformation
- Auto-closes when link clicked

### **Touch-Friendly Link Sizing**
- All links in nav: 44px+ tap height
- Buttons: 48px+ minimum height
- Spacing between links: 1rem minimum

---

## 🔄 Recommended Navigation Flow

**New Visitor → Discovery:**
```
index.html → Reads intro
          ↓
          → Interested? "Book Demo" button
          → Skeptical? Explore company.html or clients.html
```

**Building Confidence:**
```
company.html → "Schedule Demo" → book.html
solution.html → "Schedule Demo" → book.html
clients.html → "Join Hospitals" → book.html
```

**Decision Point:**
```
book.html → Fill form → Submit → Confirmation message
```

---

## 🐛 Testing Navigation Checklist

- [ ] All pages load without 404 errors
- [ ] Navigation bar on all pages is identical
- [ ] Logo on all pages links to index.html
- [ ] "Book Demo" CTA appears on all pages
- [ ] Footer links work on all pages
- [ ] Mobile menu toggles on <768px
- [ ] Active page is highlighted in navigation
- [ ] All forms submit to correct backend
- [ ] No broken image links
- [ ] Responsive layout on mobile/tablet/desktop

---

## 🚀 Deployment Verification

After deploying to production:

1. **Check Homepage:** `yoursite.com/landing/index.html`
   - ✅ Hero loads
   - ✅ Nav links work
   - ✅ Book Demo button works

2. **Check Company Page:** `yoursite.com/landing/company.html`
   - ✅ Page loads
   - ✅ Logo links home
   - ✅ CTA links to book

3. **Check Solution Page:** `yoursite.com/landing/solution.html`
   - ✅ Page loads
   - ✅ All sections visible
   - ✅ CTA works

4. **Check Clients Page:** `yoursite.com/landing/clients.html`
   - ✅ Page loads
   - ✅ All client cards visible
   - ✅ Testimonials display
   - ✅ CTA works

5. **Check Booking Page:** `yoursite.com/landing/book.html`
   - ✅ Page loads
   - ✅ Form visible and interactive
   - ✅ Form validation works
   - ✅ Form submits successfully
   - ✅ Backend receives submission

---

**Last Updated:** December 2025
**Version:** 1.0 - Complete Navigation Integration
