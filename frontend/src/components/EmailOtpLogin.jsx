import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/CPMS.png';
import isAuthenticated from '../utility/auth.utility';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function EmailOtpLogin({
  title,
  loginPath,
  dashboardPath,
  backgroundClass = 'bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-500',
  headingClass = '',
  alternateText,
  alternatePath,
  forgotRole,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.toastMessagePass || '');
  const [error, setError] = useState('');
  const [isEyeOpen, setEyeOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate(dashboardPath, { replace: true });
  }, [navigate, dashboardPath]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}${loginPath}`, { email, password });
      if (!response.data?.otpRequired) {
        throw new Error('The server did not start email verification. Please contact the administrator.');
      }
      setOtpStep(true);
      setMessage(`A 6-digit verification code has been sent to ${response.data.email || email}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.msg || requestError.message || 'Unable to start login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/otp/verify`, {
        email,
        purpose: 'login',
        code,
      });
      localStorage.setItem('token', response.data.token);
      navigate(dashboardPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Code verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/otp/resend`, { email, purpose: 'login' });
      setMessage(response.data.msg || 'A new code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Could not resend the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex justify-center items-center min-h-screen py-6 ${backgroundClass}`}>
      <form
        className="form-signin flex justify-center items-center flex-col gap-3 backdrop-blur-md bg-white/90 border border-white/40 rounded-lg p-8 shadow-xl w-1/3 max-lg:w-2/3 max-md:w-3/4 max-[400px]:w-4/5"
        onSubmit={otpStep ? handleVerify : handleLogin}
      >
        <div className="flex justify-center items-center flex-col">
          <img className="mb-4 rounded-xl shadow w-30 h-28 lg:w-40 lg:h-40" src={Logo} alt="PlaceHub logo" />
          <h1 className={`h3 mb-2 font-weight-normal text-center ${headingClass}`}>{otpStep ? 'Verify your login' : title}</h1>
          {otpStep && <p className="text-sm text-center text-slate-700">Enter the code sent to <strong>{email}</strong>.</p>}
        </div>

        {message && <p className="text-sm text-center text-green-700" role="status">{message}</p>}
        {error && <p className="text-sm text-center text-red-600" role="alert">{error}</p>}

        {!otpStep ? (
          <>
            <div className="w-full">
              <label htmlFor="login-email" className="sr-only">Email address</label>
              <input id="login-email" className="form-control" type="email" autoComplete="username" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="w-full flex items-center">
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input id="login-password" className="form-control" type={isEyeOpen ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" className="-ml-8 px-2 text-slate-600" onClick={() => setEyeOpen((open) => !open)} aria-label={isEyeOpen ? 'Hide password' : 'Show password'}>
                <i className={isEyeOpen ? 'fa-solid fa-eye' : 'fa-regular fa-eye-slash'} />
              </button>
            </div>
            <div className="w-full text-right">
              <button type="button" className="text-sm text-indigo-700 font-semibold" onClick={() => navigate(`/forgot-password?role=${forgotRole || 'student'}`)}>Forgot password?</button>
            </div>
          </>
        ) : (
          <>
            <div className="w-full">
              <label htmlFor="login-otp" className="sr-only">6-digit email code</label>
              <input id="login-otp" className="form-control text-center tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
            <div className="w-full flex justify-between text-sm">
              <button type="button" className="text-indigo-700 font-semibold" onClick={handleResend} disabled={loading}>Resend code</button>
              <button type="button" className="text-slate-600" onClick={() => { setOtpStep(false); setCode(''); setMessage(''); setError(''); }}>Back</button>
            </div>
          </>
        )}

        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : otpStep ? 'Verify & Log In' : 'Continue'}
        </button>

        {!otpStep && alternateText && alternatePath && (
          <span className="text-center text-sm">{alternateText}{' '}<button type="button" className="text-indigo-700 font-bold" onClick={() => navigate(alternatePath)}>Click here</button></span>
        )}
        <p className="text-xs text-center text-gray-500">© PlaceHub College Placement Management System</p>
      </form>
    </div>
  );
}
