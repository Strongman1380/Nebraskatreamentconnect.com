# 🚀 Quick Deployment Guide

Your Nebraska Treatment Connect application is now ready for web deployment! Here's the fastest way to get it online:

## ⚡ Quick Start (5 minutes)

### Option 1: Netlify (Easiest)
1. Run the deployment script: `./deploy.sh`
2. Go to [netlify.com/drop](https://netlify.com/drop)
3. Drag and drop the `deploy` folder
4. Your site is live! 🎉

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `./deploy.sh`
3. In the `deploy` folder, run: `vercel`
4. Follow the prompts

### Option 3: GitHub Pages
1. Push your code to GitHub
2. Go to Settings > Pages
3. Enable Pages from main branch
4. Rename `index-static.html` to `index.html`

## 🧪 Test Locally First

```bash
./deploy.sh
cd deploy
python -m http.server 8000
# Open http://localhost:8000
```

## ✨ What's Included

Your deployed site will have:
- ✅ Full facility search and filtering
- ✅ Interactive Google Maps
- ✅ Mobile-responsive design
- ✅ Location-based search
- ✅ 16 sample facilities across Nebraska
- ✅ Professional styling and UX

## 🔧 What's Different from Original

- ❌ Provider portal disabled (static version)
- ❌ Real-time updates disabled (uses static data)
- ✅ All other features work perfectly
- ✅ No backend required
- ✅ Free hosting compatible

## 📝 Next Steps

1. **Deploy** using one of the options above
2. **Test** all functionality on your live site
3. **Customize** by editing `static-data.js` to add more facilities
4. **Share** your live URL!

## 🆘 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Test locally first if you encounter issues
- Verify your Google Maps API key is working

## 🎯 Your Site Will Be Perfect For

- Treatment seekers finding facilities
- Healthcare professionals referencing services
- Community organizations sharing resources
- Mobile users searching on-the-go

**Ready to deploy? Run `./deploy.sh` and choose your hosting platform!** 🚀