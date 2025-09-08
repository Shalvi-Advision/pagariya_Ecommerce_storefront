// Authentication API service functions
const API_BASE_URL = 'https://fakestoreapi.com'; // Using Fake Store API for demo purposes

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const getCurrentUser = async (token) => {
  try {
    // In a real app, this would validate the token with the server
    // For demo purposes, we'll return mock user data
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      role: 'customer'
    };

    return mockUser;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // In a real app, this would invalidate the token on the server
    // For demo purposes, we'll just return success
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// OTP-based Authentication (Demo-friendly)
// In a production app, wire these to your backend SMS provider (e.g., Twilio)
// ---------------------------------------------------------------------------

// Request OTP for a phone number
export const requestOtp = async (phone) => {
  try {
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 600));
    // For demo: generate a 6-digit OTP and return (never do this client-side in prod)
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    // Return masked phone and otp token (in real backend, never return raw OTP)
    return {
      success: true,
      phone,
      otpToken: btoa(`${phone}:${otp}`),
      // Only for local demo/testing – display OTP for convenience
      demoOtp: otp,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
};

// Verify the OTP with an otpToken
export const verifyOtp = async ({ phone, code, otpToken }) => {
  try {
    await new Promise((r) => setTimeout(r, 500));
    // Demo-only verification
    const decoded = atob(otpToken || '');
    const expected = decoded.split(':')[1];
    const ok = expected && code && expected === code;
    if (!ok) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Issue a fake token and user
    const token = `demo-${Date.now()}`;
    const user = {
      id: 1,
      phone,
      name: 'OTP User',
      role: 'customer',
    };
    return { success: true, token, user };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};
