import React from 'react';
import EmailOtpLogin from '../EmailOtpLogin';

export default function LoginSuperUser() {
  document.title = 'PlaceHub | Admin Login';
  return (
    <EmailOtpLogin
      title="Super User Log In"
      loginPath="/admin/login"
      dashboardPath="/admin/Dashboard"
      forgotRole="admin"
      backgroundClass="bg-gradient-to-tr from-black via-slate-500 to-gray-900"
      headingClass="text-slate-900"
    />
  );
}
