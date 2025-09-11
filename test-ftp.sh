#!/bin/bash

# Test FTP Connection for DirectAdmin
echo "🔍 Testing FTP connection to DirectAdmin..."

# Load environment variables
if [ -f ".env" ]; then
    source .env
    echo "✅ Loaded .env file"
else
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Test FTP connection
echo "Testing FTP connection to: $FTP_SERVER"
echo "Username: $FTP_USERNAME"
echo "Remote directory: $REMOTE_DIR"

# Test with lftp (FTP)
if command -v lftp &> /dev/null; then
    echo "Testing FTP connection..."
    lftp -c "
    set ftp:ssl-allow no;
    open ftp://$FTP_USERNAME:$FTP_PASSWORD@$FTP_SERVER;
    ls;
    quit
    " 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ FTP connection successful!"
    else
        echo "❌ FTP connection failed. Trying SFTP..."
        
        # Test SFTP
        echo "Testing SFTP connection..."
        lftp -c "
        set sftp:auto-confirm yes;
        open sftp://$FTP_USERNAME:$FTP_PASSWORD@$FTP_SERVER;
        ls;
        quit
        " 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ SFTP connection successful!"
        else
            echo "❌ Both FTP and SFTP failed. Please check your credentials."
            echo "Common issues:"
            echo "1. Check if the password is correct"
            echo "2. Verify the server address"
            echo "3. Check if FTP/SFTP is enabled in DirectAdmin"
            echo "4. Try using the domain name instead of IP"
        fi
    fi
else
    echo "❌ lftp not installed. Please install it first:"
    echo "macOS: brew install lftp"
    echo "Linux: sudo apt-get install lftp"
fi
