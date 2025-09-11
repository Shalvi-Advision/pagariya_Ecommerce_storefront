#!/bin/bash

# React E-Commerce Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

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
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
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

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please log in:"
        vercel login
    fi
    
    # Deploy to production
    vercel --prod --yes
    
    print_success "Deployment completed successfully!"
}

# Set up custom domain
setup_domain() {
    print_status "Setting up custom domain: ecomsetup.manchar.in"
    
    # Add domain to Vercel project
    vercel domains add ecomsetup.manchar.in
    
    print_success "Domain configuration completed"
    print_warning "Please update your DNS settings to point to Vercel"
    print_warning "You will receive DNS configuration instructions from Vercel"
}

# Main deployment function
main() {
    echo "🛍️  React E-Commerce Deployment Script"
    echo "======================================"
    echo ""
    
    check_dependencies
    install_dependencies
    run_tests
    build_app
    deploy_to_vercel
    setup_domain
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "Your app will be available at: https://ecomsetup.manchar.in"
    echo ""
    echo "Next steps:"
    echo "1. Update your DNS settings as instructed by Vercel"
    echo "2. Wait for DNS propagation (can take up to 24 hours)"
    echo "3. Test your application thoroughly"
    echo "4. Set up monitoring and analytics"
}

# Run main function
main "$@"
