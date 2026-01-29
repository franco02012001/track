# Deploy to Vercel

This guide will help you deploy your frontend-only Tracker application to Vercel.

## Prerequisites

- A GitHub account (recommended) or GitLab/Bitbucket
- A Vercel account (free tier available at [vercel.com](https://vercel.com))

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Project Settings**
   - **Root Directory**: Set to `frontend` (if your repo has frontend folder)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**
   - No environment variables needed! This is a frontend-only app.
   - All data is stored in browser localStorage

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Select your account)
     - Link to existing project? **No**
     - Project name? (Enter a name or press Enter for default)
     - Directory? **./** (current directory)
     - Override settings? **No**

5. **Production Deployment**
   ```bash
   vercel --prod
   ```

## Post-Deployment

### Access Your App
- Your app will be available at: `https://your-project-name.vercel.app`
- Vercel provides automatic HTTPS
- Custom domains can be added in project settings

### Features
- ✅ Automatic deployments on git push
- ✅ Preview deployments for pull requests
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration needed

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version (Vercel uses Node 18.x by default)

### App Works Locally But Not on Vercel
- Clear browser cache and localStorage
- Check browser console for errors
- Verify all imports are correct

### Data Not Persisting
- localStorage is browser-specific
- Data persists per domain
- Clearing browser data will reset localStorage

## Notes

- **No Backend Required**: This app runs entirely in the browser
- **Data Storage**: All data is stored in browser localStorage
- **No Database**: No database setup needed
- **Free Tier**: Vercel free tier is sufficient for this app

## Updating Your Deployment

Every time you push to your main branch, Vercel will automatically:
1. Build your app
2. Run tests (if configured)
3. Deploy to production

For manual deployments:
```bash
cd frontend
vercel --prod
```

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
