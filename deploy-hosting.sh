#!/bin/bash

# React E-Commerce Deployment Script for Hosting Control Panel
# This script automates the deployment process to your existing hosting

set -e  # Exit on any error

echo "🚀 Starting deployment to hosting control panel..."

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
        print_warning "No .env file found. Please provide FTP credentials:"
        
        read -p "FTP Server (e.g., ftp.yourhost.com): " FTP_SERVER
        read -p "FTP Username: " FTP_USERNAME
        read -s -p "FTP Password: " FTP_PASSWORD
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
    npm test -- --coverage --watchAll=false
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

# Deploy via FTP
deploy_via_ftp() {
    print_status "Deploying to hosting control panel via FTP..."
    
    # Create .htaccess for React Router
    cat > build/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
EOF
    
    # Upload files using lftp
    lftp -c "
    set ftp:ssl-allow no;
    open ftp://$FTP_USERNAME:$FTP_PASSWORD@$FTP_SERVER;
    lcd build;
    cd $REMOTE_DIR;
    mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob node_modules --exclude-glob src --exclude-glob .github --exclude-glob package*.json --exclude-glob README.md --exclude-glob .env*;
    quit
    "
    
    print_success "Files uploaded successfully via FTP"
}

# Deploy via SFTP (alternative)
deploy_via_sftp() {
    print_status "Deploying via SFTP (alternative method)..."
    
    # Create .htaccess for React Router
    cat > build/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
EOF
    
    # Upload files using rsync over SSH
    rsync -avz --delete --exclude='.git*' --exclude='node_modules' --exclude='src' --exclude='.github' --exclude='package*.json' --exclude='README.md' --exclude='.env*' build/ $FTP_USERNAME@$FTP_SERVER:$REMOTE_DIR
    
    print_success "Files uploaded successfully via SFTP"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if index.html exists
    if curl -s -o /dev/null -w "%{http_code}" "https://ecomsetup.manchar.in" | grep -q "200"; then
        print_success "Deployment verified! Site is accessible at https://ecomsetup.manchar.in"
    else
        print_warning "Deployment completed but site verification failed. Please check manually."
    fi
}

# Main deployment function
main() {
    echo "🛍️  React E-Commerce Deployment Script"
    echo "======================================"
    echo "Target: ecomsetup.manchar.in"
    echo "Remote Directory: $REMOTE_DIR"
    echo ""
    
    load_config
    check_dependencies
    install_dependencies
    run_tests
    build_app
    
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
    echo "🎉 Deployment completed successfully!"
    echo "Your app is now live at: https://ecomsetup.manchar.in"
    echo ""
    echo "Next steps:"
    echo "1. Test your application thoroughly"
    echo "2. Check all routes are working"
    echo "3. Verify SSL certificate is active"
    echo "4. Set up monitoring and analytics"
    echo ""
    echo "Files uploaded to: $REMOTE_DIR"
}

# Run main function
main "$@"
