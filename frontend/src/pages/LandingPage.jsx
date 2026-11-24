import usePageTitle from '../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';
import LandingNavbar from '../components/LandingPages/LandNavbar';
import LandingHeroPage from '../components/LandingPages/LandHeroPage';
import LandingAbout from '../components/LandingPages/LandAbout';
import LandStats from '../components/LandingPages/LandStats';
import { ScrollProgress } from '../components/LandingPages/Motion';
import LandFooter from '../components/LandingPages/LandFooter';
import Toast from '../components/Toast';
import { useLocation, useNavigate } from 'react-router-dom';


function LandingPage() {
  usePageTitle("PlaceHub | Campus Placement Portal");
  const location = useLocation();
  const navigate = useNavigate();

  // Show a one-time message passed back from an authentication redirect.
  const { showToastPass = false, toastMessagePass = '' } = location.state || {};
  const [showToast, setShowToast] = useState(Boolean(showToastPass));
  const [toastMessage] = useState(toastMessagePass);

  useEffect(() => {
    if (showToastPass) {
      navigate('.', { replace: true, state: {} });
    }
  }, [showToastPass, navigate]);

  return (
    <>
      {/* Toast Component */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        delay={3000}
        position="bottom-end"
      />

      <ScrollProgress />
      <div className="flex flex-col">
        <LandingNavbar />
        <LandingHeroPage />
        <LandingAbout />
        <LandStats />
        <LandFooter />
      </div>

    </>
  )
}

export default LandingPage
