# 🚀 Deployment Guide - React E-Commerce App

## Overview

This guide will help you deploy your React e-commerce application to `ecomsetup.manchar.in` using Vercel and GitHub Actions for CI/CD.

## 📋 Prerequisites

Before starting the deployment process, ensure you have:

1. **Node.js 18+** installed
2. **Git** installed and configured
3. **GitHub account** with repository access
4. **Vercel account** (free tier available)
5. **Domain access** for `manchar.in` (to configure subdomain)

## 🛠️ Step-by-Step Deployment Process

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline and deployment configuration"
   git push origin main
   ```

2. **Verify all files are committed:**
   - `.github/workflows/deploy.yml` - GitHub Actions workflow
   - `vercel.json` - Vercel configuration
   - `deploy.sh` - Deployment script
   - `env.example` - Environment variables template

### Step 2: Set Up Vercel Account

1. **Create Vercel account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Import your repository

2. **Get Vercel credentials:**
   - Go to Vercel Dashboard → Settings → General
   - Copy your **Team ID** (Organization ID)
   - Go to Settings → Tokens
   - Create a new token and copy it

### Step 3: Configure GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings → Secrets and variables → Actions**
3. **Add the following secrets:**

   ```
   VERCEL_TOKEN=your_vercel_token_here
   VERCEL_ORG_ID=your_team_id_here
   VERCEL_PROJECT_ID=your_project_id_here
   ```

   **How to get these values:**
   - `VERCEL_TOKEN`: Create in Vercel Dashboard → Settings → Tokens
   - `VERCEL_ORG_ID`: Found in Vercel Dashboard → Settings → General
   - `VERCEL_PROJECT_ID`: Found in your project settings in Vercel

### Step 4: Configure Environment Variables

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add the following variables:

   ```
   NODE_ENV=production
   REACT_APP_API_URL=https://fakestoreapi.com
   REACT_APP_SITE_URL=https://ecomsetup.manchar.in
   REACT_APP_DOMAIN=ecomsetup.manchar.in
   REACT_APP_HTTPS=true
   ```

### Step 5: Set Up Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add domain: `ecomsetup.manchar.in`

2. **Configure DNS:**
   - Vercel will provide DNS configuration instructions
   - Update your domain's DNS settings as instructed
   - Common DNS records needed:
     ```
     Type: CNAME
     Name: ecomsetup
     Value: cname.vercel-dns.com
     ```

### Step 6: Deploy Using GitHub Actions

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the deployment workflow
   - Check for any errors

### Step 7: Alternative - Manual Deployment

If you prefer manual deployment:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Run deployment script:**
   ```bash
   ./deploy.sh
   ```

## 🔧 Configuration Files Explained

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

This file defines the CI/CD pipeline:

- **Test Job**: Runs tests and builds the application
- **Deploy Job**: Deploys to Vercel on successful tests
- **Triggers**: Runs on push to main/master branches

### Vercel Configuration (`vercel.json`)

- **Build Settings**: Configures static build process
- **Routing**: Handles SPA routing for React Router
- **Caching**: Optimizes static asset delivery
- **Environment**: Sets production environment

### Deployment Script (`deploy.sh`)

Automated deployment script that:
- Checks dependencies
- Installs packages
- Runs tests
- Builds application
- Deploys to Vercel
- Configures domain

## 🌐 Domain Configuration

### DNS Settings for `ecomsetup.manchar.in`

1. **Access your domain registrar** (where you bought `manchar.in`)

2. **Add CNAME record:**
   ```
   Type: CNAME
   Name: ecomsetup
   Value: cname.vercel-dns.com
   TTL: 300 (or default)
   ```

3. **Alternative A record** (if CNAME not supported):
   ```
   Type: A
   Name: ecomsetup
   Value: 76.76.19.61
   TTL: 300
   ```

### SSL Certificate

- Vercel automatically provides SSL certificates
- HTTPS will be enabled automatically
- No additional configuration needed

## 📊 Monitoring and Analytics

### Built-in Monitoring

1. **Vercel Analytics:**
   - Go to project → Analytics tab
   - View performance metrics
   - Monitor user behavior

2. **GitHub Actions:**
   - Monitor deployment status
   - View build logs
   - Track deployment history

### Optional Analytics Setup

Add to your environment variables:

```
REACT_APP_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
REACT_APP_HOTJAR_ID=HOTJAR_SITE_ID
```

## 🔒 Security Considerations

### Environment Variables

- Never commit sensitive data to repository
- Use GitHub Secrets for CI/CD
- Use Vercel Environment Variables for runtime

### HTTPS Configuration

- Vercel automatically handles HTTPS
- All traffic redirected to HTTPS
- SSL certificates auto-renewed

### Domain Security

- Enable domain verification in Vercel
- Set up proper CORS policies
- Configure security headers

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs in GitHub Actions

2. **Domain Not Working:**
   - Verify DNS propagation (can take 24-48 hours)
   - Check DNS configuration
   - Ensure domain is added in Vercel

3. **Environment Variables:**
   - Verify variables are set in Vercel
   - Check variable names match code
   - Ensure no typos in values

4. **Routing Issues:**
   - Verify `vercel.json` configuration
   - Check React Router setup
   - Test all routes manually

### Debug Commands

```bash
# Check Vercel status
vercel status

# View deployment logs
vercel logs

# Test local build
npm run build && npm start

# Check domain DNS
nslookup ecomsetup.manchar.in
```

## 📈 Performance Optimization

### Build Optimization

1. **Code Splitting:**
   - Implement React.lazy() for route-based splitting
   - Use dynamic imports for heavy components

2. **Asset Optimization:**
   - Optimize images before upload
   - Use WebP format when possible
   - Implement lazy loading

3. **Caching:**
   - Configure proper cache headers
   - Use CDN for static assets
   - Implement service worker for offline support

### Monitoring Performance

1. **Core Web Vitals:**
   - Monitor LCP, FID, CLS
   - Use Vercel Analytics
   - Set up alerts for performance regressions

2. **Bundle Analysis:**
   ```bash
   npm install -g @vercel/bundle-analyzer
   vercel build --analyze
   ```

## 🔄 Continuous Deployment

### Automatic Deployments

- **Main Branch**: Deploys to production
- **Feature Branches**: Deploys to preview URLs
- **Pull Requests**: Creates preview deployments

### Manual Deployments

```bash
# Deploy specific branch
vercel --prod

# Deploy with custom domain
vercel --prod --domain ecomsetup.manchar.in
```

## 📞 Support and Resources

### Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

### Community Support

- Vercel Community Forum
- GitHub Discussions
- Stack Overflow

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created and configured
- [ ] GitHub Secrets configured
- [ ] Environment variables set
- [ ] Domain added to Vercel
- [ ] DNS configured
- [ ] First deployment successful
- [ ] Domain working (https://ecomsetup.manchar.in)
- [ ] All routes working
- [ ] SSL certificate active
- [ ] Analytics configured (optional)
- [ ] Monitoring set up

## 🎉 Success!

Once all steps are completed, your React e-commerce application will be live at:

**https://ecomsetup.manchar.in**

The CI/CD pipeline will automatically deploy any changes you push to the main branch, ensuring your application is always up-to-date with the latest code.

---

**Need Help?** If you encounter any issues during deployment, check the troubleshooting section above or refer to the official documentation.
