import React from 'react';
import EmailOtpLogin from '../../components/EmailOtpLogin';

export default function StudentLogin() {
  document.title = 'PlaceHub | Student Login';
  return (
    <EmailOtpLogin
      title="Please Log In"
      loginPath="/student/login"
      dashboardPath="/student/dashboard"
      forgotRole="student"
      backgroundClass="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-500"
      alternateText="Don't have an account?"
      alternatePath="/student/signup"
    />
  );
}
