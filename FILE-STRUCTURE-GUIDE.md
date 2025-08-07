# 🗂️ File Structure Guide - Nebraska Treatment Connect

## ✅ PRODUCTION FILES (Used by GitHub Pages)

### Main Pages (Fully Functional)
- **index.html** - Home page showing residential treatment & detox centers
- **halfway-houses.html** - Halfway houses directory with facility listings
- **outpatient.html** - Outpatient providers directory (6 providers)
- **detox.html** - Informational page about detox services
- **provider-signin.html** - Working provider portal login

### Core Scripts (Fully Functional)
- **scripts.js** - Main application logic with facility filtering by page type
- **config.js** - Production configuration
- **static-data.js** - All facility data (21 facilities total)
- **provider-signin.js** - Working authentication system
- **provider-dashboard.js** - Provider dashboard functionality

### Styling
- **styles.css** - Main stylesheet (cleaned up, no duplicate styles)

## 🚫 DEMO/STATIC FILES (Not Used in Production)

### Demo Pages (Limited Functionality)
- **index-static.html** - Demo version with limitations
- **halfway-houses-static.html** - Static demo
- **outpatient-static.html** - Static demo
- **detox-static.html** - Static demo

### Demo Scripts (Limited)
- **scripts-static.js** - Demo version with disabled features
- **config-static.js** - Demo configuration

### Backup Files
- **halfway-houses-old.html** - Previous version backup
- **outpatient-old.html** - Previous version backup

## 📊 Provider Organization by Page

### Home Page (index.html)
- **Shows:** Residential Treatment Centers + Detox Centers
- **Count:** 12 facilities
- **Types:** "Treatment Center", "Detox Center"

### Halfway Houses Page (halfway-houses.html)
- **Shows:** Halfway Houses only
- **Count:** 3 facilities  
- **Types:** "Halfway House"

### Outpatient Page (outpatient.html)
- **Shows:** Outpatient Providers only
- **Count:** 6 facilities
- **Types:** "Outpatient"

### Detox Page (detox.html)
- **Shows:** Information only (no facility listings)
- **Purpose:** Educational content about detox services

## 🔐 Provider Portal

### Login System
- **File:** provider-signin.html + provider-signin.js
- **Status:** ✅ Fully functional
- **Test Credentials:**
  - Email: `admin@test.com` | Password: `password123`
  - Email: `provider@test.com` | Password: `password123`

### Dashboard
- **File:** provider-dashboard.html + provider-dashboard.js
- **Features:** Update facility status, manage listings

## 🚀 GitHub Pages Configuration

### What Gets Deployed
- All **production files** (index.html, scripts.js, etc.)
- **Static data** for offline functionality
- **Working provider portal**
- **Full search and filtering**

### What's Excluded
- Demo files are ignored by users
- Static limitations removed
- All interactive features enabled

## 🔧 How Filtering Works

The `scripts.js` file automatically detects the current page and shows only relevant facilities:

```javascript
function getCurrentPageType() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    
    if (filename.includes('halfway-houses')) return 'halfway-houses';
    if (filename.includes('outpatient')) return 'outpatient';  
    if (filename.includes('detox')) return 'detox-info';
    return 'residential-detox'; // Home page
}
```

## ⚠️ Important Notes

1. **Never use `-static` files for production**
2. **Main files (index.html, scripts.js) are fully functional**
3. **Provider portal works with localStorage authentication**
4. **All 21 facilities are properly categorized by type**
5. **Search and filtering work on all pages**

## 🎯 Current Status

✅ **Fully functional website deployed to GitHub Pages**
✅ **No demo limitations or notices**
✅ **Provider portal working**
✅ **Facilities properly organized by page**
✅ **All interactive features enabled**
✅ **Professional, production-ready site**

Your Nebraska Treatment Connect website is now fully functional and helping people find treatment across Nebraska! 🌟