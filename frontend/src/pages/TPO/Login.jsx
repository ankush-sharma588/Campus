import usePageTitle from '../../hooks/usePageTitle.js';
import EmailOtpLogin from '../../components/EmailOtpLogin';

export default function LoginTPO() {
  usePageTitle("PlaceHub | TPO Login");
  return (
    <EmailOtpLogin
      title="TPO Log In"
      loginPath="/tpo/login"
      dashboardPath="/tpo/dashboard"
      forgotRole="tpo"
      backgroundClass="bg-gradient-to-r from-red-400 via-yellow-300 to-orange-500"
      alternateText="Log in as Management?"
      alternatePath="/management/login"
    />
  );
}
