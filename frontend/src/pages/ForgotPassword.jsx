import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Logo from '../assets/CPMS.png';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ForgotPassword() {
  document.title = 'PlaceHub | Reset Password';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'student';
  const loginRoute = role === 'admin' ? '/admin' : `/${role}/login`;
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await axios.post(`${BASE_URL}/auth/password/forgot`, { email });
      setMessage(response.data.msg || 'If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Could not process the request. Please try again.');
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    setLoading(true); setError('');
    try {
      const response = await axios.post(`${BASE_URL}/auth/otp/resend`, { email, purpose: 'password_reset' });
      setMessage(response.data.msg || 'A new code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Could not resend the code.');
    } finally { setLoading(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault(); setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit verification code.');
    if (!PASSWORD_PATTERN.test(newPassword)) return setError('Password must be 8+ characters with uppercase, lowercase, number and special character.');
    if (newPassword !== confirmPassword) return setError('The passwords do not match.');
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/password/reset`, { email, code, newPassword });
      setMessage(response.data.msg || 'Password reset successfully.');
      setStep('done');
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Could not reset the password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-6 bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
      <form className="form-signin flex justify-center items-center flex-col gap-3 bg-white/95 border border-white/40 rounded-lg shadow-xl p-8 w-1/3 max-lg:w-2/3 max-md:w-3/4 max-[400px]:w-4/5" onSubmit={step === 'email' ? requestCode : step === 'reset' ? resetPassword : (event) => { event.preventDefault(); navigate(loginRoute); }}>
        <img className="mb-2 rounded-xl shadow w-28 h-24" src={Logo} alt="PlaceHub logo" />
        <h1 className="h3 text-center">{step === 'email' ? 'Forgot password' : step === 'reset' ? 'Set a new password' : 'Password updated'}</h1>
        {message && <p className="text-sm text-center text-green-700" role="status">{message}</p>}
        {error && <p className="text-sm text-center text-red-600" role="alert">{error}</p>}

        {step === 'email' && <>
          <p className="text-sm text-center text-slate-600">Enter the email address associated with your PlaceHub account.</p>
          <input className="form-control" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'}</button>
        </>}

        {step === 'reset' && <>
          <p className="text-sm text-center text-slate-600">If the account exists, a 6-digit code was sent to {email}. The code expires in 5 minutes.</p>
          <input className="form-control text-center tracking-[0.5em]" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
          <input className="form-control" type="password" autoComplete="new-password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <input className="form-control" type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <div className="w-full flex justify-between text-sm"><button type="button" className="text-indigo-700 font-semibold" onClick={resendCode} disabled={loading}>Resend code</button><button type="button" className="text-slate-600" onClick={() => { setStep('email'); setError(''); setMessage(''); }}>Change email</button></div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Updating...' : 'Reset password'}</button>
        </>}

        {step === 'done' && <button className="btn btn-primary w-full" type="submit">Return to login</button>}
        {step !== 'done' && <button type="button" className="text-sm text-indigo-700 font-semibold" onClick={() => navigate(loginRoute)}>Back to login</button>}
        <p className="text-xs text-center text-gray-500">© PlaceHub College Placement Management System</p>
      </form>
    </div>
  );
}
