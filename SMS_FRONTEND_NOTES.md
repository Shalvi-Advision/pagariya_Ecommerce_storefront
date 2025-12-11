# SMS API Frontend Integration Notes

## ✅ Status: No Code Changes Required

The existing frontend codebase used for `React_Ecommerce` is compatible with the new live SMS OTP backend.

### Key Compatibility Points:

1.  **API Endpoints Match**:
    *   Frontend calls `/auth/send-otp` with `{ mobile }`.
    *   Backend expects `/auth/send-otp` with `{ mobile }`.
    *   Frontend calls `/auth/verify-otp` with `{ mobile, otp }`.
    *   Backend expects `/auth/verify-otp` with `{ mobile, otp }`.

2.  **Validations Match**:
    *   Frontend enforces 10-digit mobile numbers.
    *   Frontend enforces 4-digit OTPs (which matches the new SMS Gateway configuration).

3.  **Error Handling**:
    *   The existing error handling in `useAuth` hook and API service is sufficient to handle the responses from the new SMS backend.

## ℹ️ Important Developer Notes

### 1. OTP Display Removed
Previously, in development mode, the OTP might have been displayed in the UI notification.
With the new Live SMS integration:
*   The API **does not** return the OTP in the response (for security).
*   The UI will simply say "OTP sent successfully".

### 2. Testing Without SMS
To avoid using SMS credits during development:
*   Use any valid mobile number.
*   Use the **Backdoor OTP**: `2786`.
*   This generic OTP allows you to bypass the SMS verification process.

### 3. Server Port Conflict Error
If you see `EADDRINUSE: address already in use :::5001` when running `npm run dev`:
*   This means the backend process is already running in the background.
*   **Solution**: Kill the process using port 5001, or just continue if the backend is already serving requests correctly.
*   Command to kill on Mac/Linux: `lsof -ti :5001 | xargs kill -9`
