# Deployment Guide for Nebraska Treatment Connect

This guide covers deploying your Nebraska Treatment Connect application as a static website to various hosting platforms.

## Static Version Overview

The static version includes:
- ✅ All search and filtering functionality
- ✅ Interactive maps with Google Maps API
- ✅ Responsive design for all devices
- ✅ Complete facility database with sample data
- ✅ Location-based search
- ✅ Multiple view modes (list/map)
- ❌ Provider portal (disabled for static deployment)
- ❌ Real-time status updates (uses static data)

## Files for Static Deployment

### Core Files
- `index-static.html` - Main page (static version)
- `config-static.js` - Configuration without Firebase
- `static-data.js` - Facility data
- `scripts-static.js` - JavaScript functionality
- `styles.css` - Styling (unchanged)

### Deployment Configuration
- `netlify.toml` - Netlify configuration
- `vercel.json` - Vercel configuration
- `DEPLOYMENT.md` - This guide

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub, GitLab, or email

2. **Deploy from Git**
   - Connect your GitHub repository
   - Set build settings:
     - Build command: (leave empty)
     - Publish directory: `.` (root)
   - Deploy site

3. **Configure Domain**
   - Netlify provides a free subdomain
   - Add custom domain if desired

4. **Environment Variables** (if needed)
   - Go to Site Settings > Environment Variables
   - Add `GOOGLE_MAPS_API_KEY` if you want to use environment variables

### Option 2: Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it as a static site

3. **Deploy**
   - Click "Deploy"
   - Your site will be live in minutes

### Option 3: GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select source: Deploy from a branch
   - Choose `main` branch, `/ (root)` folder

2. **Create Index Redirect**
   - Rename `index-static.html` to `index.html`
   - Or create a redirect in the original `index.html`

3. **Access Your Site**
   - Available at `https://yourusername.github.io/repository-name`

### Option 4: Traditional Web Hosting

1. **Upload Files**
   - Upload all files to your web hosting provider
   - Ensure `index-static.html` is set as the default page

2. **Configure Server**
   - Set up redirects if needed
   - Ensure HTTPS is enabled

## Configuration Steps

### 1. Google Maps API Key

Your current API key is already configured, but for production:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API and Geocoding API
3. Restrict API key by domain for security
4. Update `config-static.js` with your production key

### 2. Domain Restrictions

For security, restrict your Google Maps API key to your domain:
- In Google Cloud Console > APIs & Services > Credentials
- Edit your API key
- Add your domain to "Website restrictions"

### 3. Content Security Policy

The deployment configurations include CSP headers for security. Adjust if needed.

## Testing Your Deployment

### Local Testing

1. **Simple HTTP Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx serve .
   ```

2. **Open Browser**
   - Go to `http://localhost:8000/index-static.html`
   - Test all functionality

### Production Testing

1. **Functionality Checklist**
   - ✅ Search by name, city, ZIP code
   - ✅ Filter by age group, gender, treatment type
   - ✅ Location-based search
   - ✅ Map view with markers
   - ✅ Facility details and actions
   - ✅ Responsive design on mobile

2. **Performance Testing**
   - Check page load speed
   - Test on different devices
   - Verify Google Maps integration

## Customization Options

### Adding More Facilities

Edit `static-data.js` to add more facilities:

```javascript
{
    id: 17,
    name: "New Facility Name",
    type: "Treatment Center",
    address: "123 Main St, City, NE 12345",
    phone: "(402) 555-0123",
    website: "https://example.com",
    ageGroup: "Adult",
    genderServed: "Co-ed",
    treatmentType: "Both",
    status: "Openings Available",
    lastUpdated: "2025-01-27",
    coordinates: { lat: 41.2565, lng: -95.9345 }
}
```

### Updating Styling

Modify `styles.css` to change:
- Colors and branding
- Layout and spacing
- Mobile responsiveness
- Status indicators

### Adding Features

The static version can be extended with:
- Contact forms (using Netlify Forms or Formspree)
- Analytics (Google Analytics)
- Chat widgets
- Additional pages

## Maintenance

### Regular Updates

1. **Facility Information**
   - Update `static-data.js` with new facilities
   - Verify contact information regularly

2. **Status Updates**
   - Manually update facility statuses
   - Consider adding "Last Updated" notices

3. **Security Updates**
   - Keep API keys secure
   - Monitor for security advisories
   - Update CSP headers as needed

## Migration to Dynamic Version

If you later want to add dynamic features:

1. **Backend Options**
   - Firebase (original choice)
   - Supabase (open-source alternative)
   - Airtable (simple database)
   - Custom API with Node.js/Python

2. **Migration Steps**
   - Set up chosen backend
   - Migrate static data to database
   - Update JavaScript to use API calls
   - Re-enable provider portal

## Support and Troubleshooting

### Common Issues

1. **Maps Not Loading**
   - Check API key configuration
   - Verify domain restrictions
   - Check browser console for errors

2. **Search Not Working**
   - Verify `static-data.js` is loaded
   - Check browser console for JavaScript errors

3. **Mobile Issues**
   - Test responsive design
   - Check viewport meta tag
   - Verify touch interactions

### Getting Help

- Check browser developer console for errors
- Test in different browsers
- Verify all files are uploaded correctly
- Check hosting provider documentation

## Cost Considerations

### Free Tier Limits

- **Netlify**: 100GB bandwidth/month, 300 build minutes
- **Vercel**: 100GB bandwidth/month, unlimited static sites
- **GitHub Pages**: 1GB storage, 100GB bandwidth/month
- **Google Maps API**: $200 free credit monthly (covers ~28,000 map loads)

### Scaling Up

If you exceed free limits:
- Netlify Pro: $19/month
- Vercel Pro: $20/month
- Google Maps: Pay-per-use after free credit

Your static site should handle significant traffic within free tiers.