# 🚀 DirectAdmin Deployment Guide

## Overview

This guide will help you deploy your React e-commerce application to DirectAdmin hosting at `ecomsetup.manchar.in` using FTP/SFTP and GitHub Actions for CI/CD.

## 📋 Prerequisites

Before starting the deployment process, ensure you have:

1. **Node.js 18+** installed
2. **Git** installed and configured
3. **GitHub account** with repository access
4. **DirectAdmin hosting account** with FTP access
5. **Subdomain already created** (ecomsetup.manchar.in) ✅

## 🛠️ Step-by-Step Deployment Process

### Step 1: Get DirectAdmin FTP Credentials

From your DirectAdmin control panel:

1. **Login to DirectAdmin:**
   - Go to your DirectAdmin URL (usually `yourdomain.com:2222`)
   - Login with your credentials

2. **Get FTP Information:**
   - Go to **"FTP Management"** in the left sidebar
   - Note down:
     - **FTP Server**: Usually your domain or IP address
     - **FTP Username**: Your DirectAdmin username
     - **FTP Password**: Your DirectAdmin password
     - **Port**: Usually 21 (FTP) or 22 (SFTP)

3. **Verify Subdomain Setup:**
   - Go to **"Subdomain Management"** (which you already have)
   - Confirm `ecomsetup.manchar.in` is set up
   - Document root: `/domains/ecomsetup.manchar.in/public_html/` ✅

### Step 2: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add DirectAdmin CI/CD pipeline"
   git push origin main
   ```

2. **Verify all files are committed:**
   - `.github/workflows/deploy-directadmin.yml` - DirectAdmin GitHub Actions workflow
   - `deploy-directadmin.sh` - DirectAdmin deployment script
   - `env.example` - Environment variables template

### Step 3: Configure GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings → Secrets and variables → Actions**
3. **Add the following secrets:**

   ```
   DIRECTADMIN_FTP_SERVER=your_ftp_server_here
   DIRECTADMIN_FTP_USERNAME=your_ftp_username_here
   DIRECTADMIN_FTP_PASSWORD=your_ftp_password_here
   DIRECTADMIN_SFTP_SERVER=your_sftp_server_here (optional, same as FTP)
   DIRECTADMIN_SFTP_USERNAME=your_sftp_username_here (optional, same as FTP)
   DIRECTADMIN_SFTP_PASSWORD=your_sftp_password_here (optional, same as FTP)
   ```

### Step 4: Configure Environment Variables (Local Development)

1. **Create a `.env` file in your project root:**
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file with your DirectAdmin FTP credentials:**
   ```
   FTP_SERVER=your_directadmin_ftp_server_here
   FTP_USERNAME=your_directadmin_username_here
   FTP_PASSWORD=your_directadmin_password_here
   REMOTE_DIR=/domains/ecomsetup.manchar.in/public_html/
   ```

### Step 5: Test Local Deployment

1. **Run the DirectAdmin deployment script:**
   ```bash
   ./deploy-directadmin.sh
   ```

2. **Verify the deployment:**
   - Check DirectAdmin File Manager
   - Visit `https://ecomsetup.manchar.in` to test

### Step 6: Set Up Automatic Deployment

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the "Deploy to DirectAdmin Hosting" workflow
   - Check for any errors

## 🔧 DirectAdmin-Specific Configuration

### .htaccess Configuration

The deployment script creates a DirectAdmin-optimized `.htaccess` file with:

- **React Router Support**: Handles SPA routing
- **Security Headers**: XSS protection, content type options
- **Caching**: Optimized cache headers for static assets
- **Gzip Compression**: Reduces file sizes
- **File Protection**: Prevents access to sensitive files

### DirectAdmin File Structure

After deployment, your DirectAdmin directory will be:
```
/domains/ecomsetup.manchar.in/public_html/
├── index.html
├── .htaccess
├── static/
│   ├── css/
│   ├── js/
│   └── media/
└── other static files
```

## 🌐 DirectAdmin Control Panel Configuration

### SSL Certificate Setup

1. **Go to SSL Management:**
   - In DirectAdmin, go to **"SSL Certificates"**
   - Look for `ecomsetup.manchar.in`
   - Enable SSL if not already active

2. **Force HTTPS:**
   - The `.htaccess` file handles this automatically
   - Ensure mod_rewrite is enabled in DirectAdmin

### Apache Configuration

1. **Check mod_rewrite:**
   - Go to **"Apache Configuration"** or **"PHP Settings"**
   - Ensure mod_rewrite is enabled
   - This is required for React Router

2. **Enable .htaccess:**
   - Ensure `.htaccess` files are allowed
   - This should be enabled by default in DirectAdmin

### Performance Optimization

1. **Enable Gzip:**
   - The `.htaccess` file includes Gzip compression
   - Verify it's working in DirectAdmin

2. **Caching:**
   - Static assets are configured for long-term caching
   - Check DirectAdmin statistics for performance

## 📊 DirectAdmin Monitoring

### File Manager

1. **Access File Manager:**
   - Go to **"File Manager"** in DirectAdmin
   - Navigate to `/domains/ecomsetup.manchar.in/public_html/`
   - Verify all files are uploaded correctly

2. **Check File Permissions:**
   - Files should be 644
   - Directories should be 755
   - The deployment script handles this automatically

### Statistics and Logs

1. **Bandwidth Usage:**
   - Monitor in **"Statistics"** section
   - Track monthly usage

2. **Error Logs:**
   - Check **"Error Logs"** if issues occur
   - Look for Apache errors

3. **Access Logs:**
   - Monitor in **"Access Logs"**
   - Track visitor activity

## 🔒 Security Considerations

### DirectAdmin Security

1. **FTP Credentials:**
   - Use strong passwords
   - Consider changing default FTP password
   - Use SFTP when possible

2. **File Permissions:**
   - Ensure proper file permissions
   - The deployment script sets correct permissions

3. **SSL Certificate:**
   - Always use HTTPS
   - Monitor certificate expiration

### Application Security

1. **Environment Variables:**
   - Never commit `.env` file
   - Use GitHub Secrets for CI/CD

2. **Sensitive Files:**
   - The `.htaccess` file protects sensitive files
   - Prevents access to `.env`, logs, etc.

## 🚨 Troubleshooting

### Common DirectAdmin Issues

1. **FTP Connection Failed:**
   - Verify FTP credentials in DirectAdmin
   - Check if FTP is enabled
   - Try SFTP instead

2. **Files Not Uploading:**
   - Check file permissions in DirectAdmin
   - Verify subdomain document root
   - Ensure FTP user has write permissions

3. **React Router Not Working:**
   - Check if mod_rewrite is enabled
   - Verify `.htaccess` file was uploaded
   - Check Apache error logs

4. **SSL Certificate Issues:**
   - Check SSL status in DirectAdmin
   - Verify domain configuration
   - Wait for SSL propagation

### DirectAdmin Debug Commands

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

### DirectAdmin Optimizations

1. **Enable Gzip:**
   - The `.htaccess` file includes Gzip compression
   - Verify in DirectAdmin statistics

2. **Caching:**
   - Static assets are configured for caching
   - Monitor performance in DirectAdmin

3. **CDN Integration:**
   - Consider using DirectAdmin's CDN features
   - Many DirectAdmin hosts offer CDN

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
./deploy-directadmin.sh

# Deploy specific branch
git checkout feature-branch
./deploy-directadmin.sh
```

## 📞 DirectAdmin Support

### Hosting Provider Support

- Contact your DirectAdmin hosting provider
- Check their documentation
- Use their support ticket system

### DirectAdmin Resources

- [DirectAdmin Documentation](https://www.directadmin.com/docs.php)
- [DirectAdmin Forum](https://forum.directadmin.com/)
- [DirectAdmin Knowledge Base](https://www.directadmin.com/kb/)

## ✅ DirectAdmin Deployment Checklist

- [ ] DirectAdmin FTP credentials obtained
- [ ] GitHub repository created and code pushed
- [ ] GitHub Secrets configured
- [ ] Local `.env` file created
- [ ] First deployment successful
- [ ] Files visible in DirectAdmin File Manager
- [ ] Website accessible at https://ecomsetup.manchar.in
- [ ] All React Router routes working
- [ ] SSL certificate active in DirectAdmin
- [ ] .htaccess file uploaded and working
- [ ] mod_rewrite enabled in DirectAdmin
- [ ] Performance optimizations working
- [ ] Error logs checked
- [ ] Statistics monitoring set up

## 🎉 Success!

Once all steps are completed, your React e-commerce application will be live at:

**https://ecomsetup.manchar.in**

The CI/CD pipeline will automatically deploy any changes you push to the main branch, ensuring your application is always up-to-date with the latest code.

### DirectAdmin Management

After deployment, you can manage your application through:
- **File Manager**: Upload/manage files
- **SSL Management**: Monitor certificates
- **Statistics**: Track performance and usage
- **Error Logs**: Debug issues
- **FTP Management**: Manual file uploads if needed

---


