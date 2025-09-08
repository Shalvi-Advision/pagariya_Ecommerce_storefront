import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const LoginPage = () => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [errors, setErrors] = useState({});
  const [info, setInfo] = useState('');

  const { requestPhoneOtp, verifyPhoneOtp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (error) setInfo('');
  }, [error]);

  const validatePhone = () => {
    const newErrors = {};
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) newErrors.phone = 'Phone is required';
    else if (cleaned.length < 10) newErrors.phone = 'Enter a valid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otp.trim()) newErrors.otp = 'Enter the OTP';
    else if (otp.trim().length < 4) newErrors.otp = 'OTP must be at least 4 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validatePhone()) return;
    if (error) clearError();
    const res = await requestPhoneOtp(phone);
    if (res?.success) {
      setOtpToken(res.otpToken);
      setStep('otp');
      setInfo(`OTP sent to ${phone}. ${res.demoOtp ? `Demo OTP: ${res.demoOtp}` : ''}`);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;
    const result = await verifyPhoneOtp({ phone, code: otp, otpToken });
    if (result.success) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Sign in with OTP</h2>
        </div>

        <Card>
          <form onSubmit={step === 'phone' ? handleRequestOtp : handleVerifyOtp} className="space-y-6">
            {(error || info) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {error && <p className="text-red-800 text-sm">{error}</p>}
                {!error && info && <p className="text-green-700 text-sm">{info}</p>}
              </div>
            )}

            {step === 'phone' && (
              <>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    if (error) clearError();
                  }}
                  error={errors.phone}
                  placeholder="Enter your phone number"
                  required
                />

                <Button type="submit" disabled={loading} className="w-full" size="large">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <Input
                  label="Enter OTP"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                    if (error) clearError();
                  }}
                  error={errors.otp}
                  placeholder="6-digit code"
                  required
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                    onClick={async () => {
                      const res = await requestPhoneOtp(phone);
                      if (res?.success) {
                        setOtp('');
                        setOtpToken(res.otpToken);
                        setInfo(`OTP resent. ${res.demoOtp ? `Demo OTP: ${res.demoOtp}` : ''}`);
                      }
                    }}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setInfo('');
                    }}
                  >
                    Change phone
                  </button>
                </div>

                <Button type="submit" disabled={loading} className="w-full" size="large">
                  {loading ? 'Verifying...' : 'Verify & Sign in'}
                </Button>
              </>
            )}
          </form>
        </Card>

        {/* Removed sign-up link per requirement */}

        {/* OTP Info */}
        <Card className="mt-8">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">About OTP Demo</h3>
            <p className="text-xs text-gray-600">
              This environment uses a demo OTP flow. The OTP is generated locally and displayed after sending for testing purposes. Integrate with your backend SMS provider for production.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
