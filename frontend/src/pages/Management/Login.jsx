import React from 'react';
import EmailOtpLogin from '../../components/EmailOtpLogin';

export default function LoginManagement() {
  document.title = 'PlaceHub | Management Login';
  return (
    <EmailOtpLogin
      title="Management Log In"
      loginPath="/management/login"
      dashboardPath="/management/dashboard"
      forgotRole="management"
      backgroundClass="bg-gradient-to-r from-cyan-500 via-purple-400 to-pink-500"
      alternateText="Log in as TPO?"
      alternatePath="/tpo/login"
    />
  );
}
