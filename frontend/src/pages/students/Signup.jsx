import usePageTitle from '../../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../../assets/placehub-mark.svg';
import isAuthenticated from '../../utility/auth.utility';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Signup() {
  usePageTitle("PlaceHub | Student Sign Up");
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ first_name: '', email: location.state?.prefillEmail || '', number: '', password: '' });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate('/student/dashboard', { replace: true });
  }, [navigate]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    const { first_name, email, number, password } = formData;
    if (!first_name.trim() || !email.trim() || !number || !password) return setError('Please complete all fields.');
    if (!/^\d{10}$/.test(String(number))) return setError('Phone number must contain exactly 10 digits.');
    if (!PASSWORD_PATTERN.test(password)) return setError('Password must be 8+ characters with uppercase, lowercase, number and special character.');

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/student/signup`, formData);
      setOtpStep(true);
      setMessage(response.data.msg || `A verification code was sent to ${email}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Registration could not be started. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code sent to your email.');
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/otp/verify`, {
        email: formData.email,
        purpose: 'signup',
        code: otp,
      });
      navigate('/student/login', { replace: true, state: { toastMessagePass: response.data.msg || 'Email verified successfully.' } });
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
      const response = await axios.post(`${BASE_URL}/auth/otp/resend`, { email: formData.email, purpose: 'signup' });
      setMessage(response.data.msg || 'A new verification code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'Could not resend the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-6 min-h-screen bg-gradient-to-r from-red-400 via-pink-300 to-purple-300">
      <form className="form-signin flex justify-center items-center flex-col gap-3 backdrop-blur-md bg-white/90 border border-white/30 rounded-lg shadow-xl p-8 w-1/3 max-lg:w-2/3 max-md:w-3/4 max-[400px]:w-4/5" onSubmit={otpStep ? handleVerify : handleRegister}>
        <div className="flex justify-center items-center flex-col">
          <img className="mb-4 rounded-xl shadow w-30 h-28 lg:w-40 lg:h-40" src={Logo} alt="PlaceHub logo" />
          <h1 className="h3 mb-2 font-weight-normal text-center">{otpStep ? 'Verify your email' : 'Sign Up as a Student'}</h1>
          {otpStep && <p className="text-sm text-center">Enter the 6-digit code sent to <strong>{formData.email}</strong>.</p>}
        </div>
        {message && <p className="text-sm text-center text-green-700" role="status">{message}</p>}
        {error && <p className="text-sm text-center text-red-600" role="alert">{error}</p>}

        {!otpStep ? (
          <>
            <input className="form-control" type="text" placeholder="Full name" autoComplete="name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            <input className="form-control" type="email" placeholder="Email address" autoComplete="email" name="email" value={formData.email} onChange={handleChange} required />
            <input className="form-control" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit phone number" autoComplete="tel" name="number" value={formData.number} onChange={(event) => { setFormData((current) => ({ ...current, number: event.target.value.replace(/\D/g, '').slice(0, 10) })); setError(''); }} required />
            <div className="w-full flex items-center">
              <input className="form-control" type={showPassword ? 'text' : 'password'} placeholder="Password" autoComplete="new-password" name="password" value={formData.password} onChange={handleChange} required />
              <button type="button" className="-ml-8 px-2 text-slate-600" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}><i className={showPassword ? 'fa-solid fa-eye' : 'fa-regular fa-eye-slash'} /></button>
            </div>
            <p className="text-xs text-slate-600">At least 8 characters, including uppercase, lowercase, number and special character.</p>
          </>
        ) : (
          <>
            <input className="form-control text-center tracking-[0.5em]" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
            <div className="w-full flex justify-between text-sm">
              <button type="button" className="text-indigo-700 font-semibold" onClick={handleResend} disabled={loading}>Resend code</button>
              <button type="button" className="text-slate-600" onClick={() => { setOtpStep(false); setOtp(''); setMessage(''); setError(''); }}>Edit details</button>
            </div>
          </>
        )}

        <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Please wait...' : otpStep ? 'Verify email' : 'Sign Up'}</button>
        {!otpStep && <span className="text-center">Already have an account? <button type="button" className="text-indigo-700 font-bold px-1" onClick={() => navigate('/student/login')}>Login</button></span>}
        <p className="text-xs text-center text-gray-500">© PlaceHub</p>
      </form>
    </div>
  );
}
