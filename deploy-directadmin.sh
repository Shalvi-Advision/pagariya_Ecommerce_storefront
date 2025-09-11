#!/bin/bash

# React E-Commerce Deployment Script for DirectAdmin Hosting
# This script automates the deployment process to DirectAdmin hosting

set -e  # Exit on any error

echo "🚀 Starting DirectAdmin deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
FTP_SERVER=""
FTP_USERNAME=""
FTP_PASSWORD=""
REMOTE_DIR="/domains/ecomsetup.manchar.in/public_html/"

# Load configuration from environment or prompt user
load_config() {
    if [ -f ".env" ]; then
        source .env
        print_status "Loaded configuration from .env file"
    else
        print_warning "No .env file found. Please provide DirectAdmin FTP credentials:"
        
        read -p "DirectAdmin FTP Server (e.g., ftp.yourdomain.com or IP): " FTP_SERVER
        read -p "DirectAdmin FTP Username: " FTP_USERNAME
        read -s -p "DirectAdmin FTP Password: " FTP_PASSWORD
        echo
        
        # Save configuration for future use
        cat > .env << EOF
FTP_SERVER=$FTP_SERVER
FTP_USERNAME=$FTP_USERNAME
FTP_PASSWORD=$FTP_PASSWORD
REMOTE_DIR=$REMOTE_DIR
EOF
        print_success "Configuration saved to .env file"
    fi
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v lftp &> /dev/null; then
        print_warning "lftp is not installed. Installing now..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install lftp
            else
                print_error "Please install Homebrew first, then run: brew install lftp"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo apt-get update && sudo apt-get install -y lftp
        else
            print_error "Please install lftp manually for your operating system"
            exit 1
        fi
    fi
    
    print_success "All dependencies are available"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test -- --coverage --watchAll=false --passWithNoTests
    print_success "All tests passed"
}

# Build the application
build_app() {
    print_status "Building application for production..."
    npm run build
    
    if [ ! -d "build" ]; then
        print_error "Build failed - build directory not found"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Create DirectAdmin-specific .htaccess
create_directadmin_htaccess() {
    print_status "Creating DirectAdmin-optimized .htaccess..."
    
    cat > build/.htaccess << 'EOF'
# DirectAdmin .htaccess for React SPA
Options -MultiViews
RewriteEngine On

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L,QSA]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 year"
  Header set Cache-Control "public, immutable"
</FilesMatch>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\.(env|log|htaccess|htpasswd|ini|phps|fla|psd|log|sh)$">
  Order Allow,Deny
  Deny from all
</FilesMatch>
EOF
    
    print_success "DirectAdmin .htaccess created with optimizations"
}

# Deploy via FTP
deploy_via_ftp() {
    print_status "Deploying to DirectAdmin via FTP..."
    
    # Upload files using lftp
    lftp -c "
    set ftp:ssl-allow no;
    open ftp://$FTP_USERNAME:$FTP_PASSWORD@$FTP_SERVER;
    lcd build;
    cd $REMOTE_DIR;
    mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob node_modules --exclude-glob src --exclude-glob .github --exclude-glob package*.json --exclude-glob README.md --exclude-glob .env* --exclude-glob deploy*.sh --exclude-glob *.md;
    quit
    "
    
    print_success "Files uploaded successfully via FTP to DirectAdmin"
}

# Deploy via SFTP (alternative)
deploy_via_sftp() {
    print_status "Deploying via SFTP (alternative method)..."
    
    # Upload files using rsync over SSH
    rsync -avz --delete --exclude='.git*' --exclude='node_modules' --exclude='src' --exclude='.github' --exclude='package*.json' --exclude='README.md' --exclude='.env*' --exclude='deploy*.sh' --exclude='*.md' build/ $FTP_USERNAME@$FTP_SERVER:$REMOTE_DIR
    
    print_success "Files uploaded successfully via SFTP to DirectAdmin"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying DirectAdmin deployment..."
    
    # Wait a moment for files to propagate
    sleep 5
    
    # Check if index.html exists
    if curl -s -o /dev/null -w "%{http_code}" "https://ecomsetup.manchar.in" | grep -q "200"; then
        print_success "✅ Main page accessible at https://ecomsetup.manchar.in"
    else
        print_warning "⚠️  Main page not accessible yet (may need time to propagate)"
    fi
    
    # Check if .htaccess is working (React Router)
    if curl -s -o /dev/null -w "%{http_code}" "https://ecomsetup.manchar.in/some-route" | grep -q "200"; then
        print_success "✅ React Router working (.htaccess configured correctly)"
    else
        print_warning "⚠️  React Router may need configuration in DirectAdmin"
    fi
    
    # Check SSL
    if curl -s -o /dev/null -w "%{http_code}" "https://ecomsetup.manchar.in" | grep -q "200"; then
        print_success "✅ HTTPS working (SSL certificate active)"
    else
        print_warning "⚠️  HTTPS may need configuration in DirectAdmin"
    fi
}

# Main deployment function
main() {
    echo "🛍️  React E-Commerce DirectAdmin Deployment Script"
    echo "=================================================="
    echo "Target: ecomsetup.manchar.in"
    echo "DirectAdmin Path: $REMOTE_DIR"
    echo ""
    
    load_config
    check_dependencies
    install_dependencies
    run_tests
    build_app
    create_directadmin_htaccess
    
    # Try FTP first, then SFTP as fallback
    if deploy_via_ftp; then
        print_success "FTP deployment successful"
    else
        print_warning "FTP deployment failed, trying SFTP..."
        if deploy_via_sftp; then
            print_success "SFTP deployment successful"
        else
            print_error "Both FTP and SFTP deployments failed"
            exit 1
        fi
    fi
    
    verify_deployment
    
    echo ""
    echo "🎉 DirectAdmin deployment completed successfully!"
    echo "Your app is now live at: https://ecomsetup.manchar.in"
    echo ""
    echo "DirectAdmin Management:"
    echo "1. Check File Manager in DirectAdmin to verify files"
    echo "2. Verify SSL certificate in SSL Management"
    echo "3. Check Apache error logs if needed"
    echo "4. Monitor bandwidth usage in Statistics"
    echo ""
    echo "Files uploaded to: $REMOTE_DIR"
    echo ""
    echo "Next steps:"
    echo "1. Test all React Router routes"
    echo "2. Verify performance in DirectAdmin"
    echo "3. Set up monitoring and analytics"
    echo "4. Configure any additional DirectAdmin features"
}

# Run main function
main "$@"
