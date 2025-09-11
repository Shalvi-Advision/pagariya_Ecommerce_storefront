# 🚀 Hosting Control Panel Deployment Guide

## Overview

This guide will help you deploy your React e-commerce application to your existing hosting control panel at `ecomsetup.manchar.in` using FTP/SFTP and GitHub Actions for CI/CD.

## 📋 Prerequisites

Before starting the deployment process, ensure you have:

1. **Node.js 18+** installed
2. **Git** installed and configured
3. **GitHub account** with repository access
4. **FTP/SFTP credentials** from your hosting control panel
5. **Access to hosting control panel** (which you already have!)

## 🛠️ Step-by-Step Deployment Process

### Step 1: Get FTP Credentials from Control Panel

From your hosting control panel, you need to get:

1. **FTP Server Address:**
   - Look for "FTP Management" in your control panel
   - Note down the FTP server (usually something like `ftp.yourdomain.com` or an IP address)

2. **FTP Username and Password:**
   - These are usually the same as your control panel login
   - Or check "FTP Management" section for specific FTP credentials

3. **Document Root Path:**
   - From your subdomain setup, I can see it's: `/domains/ecomsetup.manchar.in/public_html/`

### Step 2: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add hosting control panel CI/CD pipeline"
   git push origin main
   ```

2. **Verify all files are committed:**
   - `.github/workflows/deploy-hosting.yml` - GitHub Actions workflow for hosting
   - `deploy-hosting.sh` - Hosting deployment script
   - `env.example` - Environment variables template

### Step 3: Configure GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings → Secrets and variables → Actions**
3. **Add the following secrets:**

   ```
   FTP_SERVER=your_ftp_server_here
   FTP_USERNAME=your_ftp_username_here
   FTP_PASSWORD=your_ftp_password_here
   SFTP_SERVER=your_sftp_server_here (optional, same as FTP)
   SFTP_USERNAME=your_sftp_username_here (optional, same as FTP)
   SFTP_PASSWORD=your_sftp_password_here (optional, same as FTP)
   ```

### Step 4: Configure Environment Variables (Local Development)

1. **Create a `.env` file in your project root:**
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file with your FTP credentials:**
   ```
   FTP_SERVER=your_ftp_server_here
   FTP_USERNAME=your_ftp_username_here
   FTP_PASSWORD=your_ftp_password_here
   REMOTE_DIR=/domains/ecomsetup.manchar.in/public_html/
   ```

### Step 5: Test Local Deployment

1. **Run the deployment script locally:**
   ```bash
   ./deploy-hosting.sh
   ```

2. **Verify the deployment:**
   - Check if files are uploaded to your hosting
   - Visit `https://ecomsetup.manchar.in` to test

### Step 6: Set Up Automatic Deployment

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the "Deploy to Hosting Control Panel" workflow
   - Check for any errors

## 🔧 Configuration Files Explained

### GitHub Actions Workflow (`.github/workflows/deploy-hosting.yml`)

This file defines the CI/CD pipeline for your hosting:

- **Test Job**: Runs tests and builds the application
- **Deploy Job**: Uploads files via FTP/SFTP to your hosting
- **Triggers**: Runs on push to main/master branches
- **Target Directory**: `/domains/ecomsetup.manchar.in/public_html/`

### Hosting Deployment Script (`deploy-hosting.sh`)

Automated deployment script that:
- Loads FTP credentials from `.env` file
- Checks dependencies (Node.js, npm, lftp)
- Installs packages and runs tests
- Builds the React application
- Uploads files via FTP (with SFTP fallback)
- Creates `.htaccess` for React Router support
- Verifies deployment

### Environment Configuration (`env.example`)

Template for environment variables:
- FTP server credentials
- Remote directory path
- Optional SFTP credentials

## 🌐 Hosting Control Panel Configuration

### Subdomain Setup (Already Done!)

I can see from your control panel that:
- ✅ Subdomain `ecomsetup.manchar.in` is already created
- ✅ Document root is set to `/domains/ecomsetup.manchar.in/public_html/`
- ✅ PHP version is set to 7.4 (which is fine for static files)

### Additional Configuration Needed

1. **Enable .htaccess Support:**
   - In your control panel, look for "Apache Configuration" or "Mod Rewrite"
   - Ensure `.htaccess` files are enabled
   - This is needed for React Router to work properly

2. **Set Default Index File:**
   - Ensure `index.html` is set as the default index file
   - This should already be configured

3. **Enable Gzip Compression:**
   - Look for "Performance" or "Optimization" settings
   - Enable Gzip compression for better performance

### SSL Certificate Setup

1. **Check SSL Status:**
   - In your control panel, look for "SSL Certificates"
   - Ensure SSL is enabled for `ecomsetup.manchar.in`

2. **Force HTTPS:**
   - The deployment script creates an `.htaccess` file that handles this
   - Ensure your hosting supports `.htaccess` files

## 📊 File Structure After Deployment

Your hosting directory structure will be:
```
/domains/ecomsetup.manchar.in/public_html/
├── index.html
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── .htaccess
└── other static files
```

## 🔒 Security Considerations

### FTP Credentials

- Never commit `.env` file to repository
- Use GitHub Secrets for CI/CD
- Use strong, unique passwords
- Consider using SFTP instead of FTP for better security

### File Permissions

- Ensure proper file permissions (644 for files, 755 for directories)
- The deployment script handles this automatically

### .htaccess Security

The deployment script creates a secure `.htaccess` file:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

## 🚨 Troubleshooting

### Common Issues

1. **FTP Connection Failed:**
   - Verify FTP credentials in `.env` file
   - Check if FTP is enabled in your hosting control panel
   - Try SFTP instead of FTP

2. **Files Not Uploading:**
   - Check file permissions
   - Verify remote directory path
   - Ensure FTP user has write permissions

3. **React Router Not Working:**
   - Verify `.htaccess` file was uploaded
   - Check if mod_rewrite is enabled
   - Ensure `.htaccess` files are allowed

4. **SSL Certificate Issues:**
   - Check SSL status in control panel
   - Verify domain configuration
   - Wait for SSL propagation (up to 24 hours)

### Debug Commands

```bash
# Test FTP connection
lftp -c "open ftp://username:password@server; ls"

# Check local build
npm run build && ls -la build/

# Test website
curl -I https://ecomsetup.manchar.in

# Check .htaccess
curl -I https://ecomsetup.manchar.in/some-route
```

## 📈 Performance Optimization

### Hosting Optimizations

1. **Enable Gzip Compression:**
   - In control panel: Performance → Gzip Compression → Enable

2. **Set Cache Headers:**
   - Configure browser caching for static assets
   - Set appropriate cache expiration times

3. **CDN Integration:**
   - Consider using a CDN for static assets
   - Many hosting providers offer CDN services

### Build Optimizations

1. **Code Splitting:**
   - Implement React.lazy() for route-based splitting
   - Use dynamic imports for heavy components

2. **Asset Optimization:**
   - Optimize images before upload
   - Use WebP format when possible
   - Implement lazy loading

## 🔄 Continuous Deployment

### Automatic Deployments

- **Main Branch**: Deploys to production
- **Feature Branches**: Can be configured for staging
- **Pull Requests**: Can be configured for preview deployments

### Manual Deployments

```bash
# Deploy manually
./deploy-hosting.sh

# Deploy specific branch
git checkout feature-branch
./deploy-hosting.sh
```

## 📞 Support and Resources

### Hosting Control Panel Help

- Check your hosting provider's documentation
- Look for "FTP Management" or "File Manager" sections
- Contact hosting support if needed

### GitHub Actions Help

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [FTP Deploy Action](https://github.com/SamKirkland/FTP-Deploy-Action)

## ✅ Deployment Checklist

- [ ] FTP credentials obtained from control panel
- [ ] GitHub repository created and code pushed
- [ ] GitHub Secrets configured
- [ ] Local `.env` file created
- [ ] First deployment successful
- [ ] Website accessible at https://ecomsetup.manchar.in
- [ ] All React Router routes working
- [ ] SSL certificate active
- [ ] .htaccess file uploaded and working
- [ ] Performance optimizations enabled
- [ ] Monitoring set up (optional)

## 🎉 Success!

Once all steps are completed, your React e-commerce application will be live at:

**https://ecomsetup.manchar.in**

The CI/CD pipeline will automatically deploy any changes you push to the main branch, ensuring your application is always up-to-date with the latest code.

---

**Need Help?** If you encounter any issues during deployment, check the troubleshooting section above or refer to your hosting provider's documentation.
