import { Magnetic } from './Motion';
import { useNavigate } from 'react-router-dom';

function LandFooter() {
  const navigate = useNavigate();

  const loginLinks = [
    { label: 'Login as TPO', path: '/tpo/login' },
    { label: 'Login as Management', path: '/management/login' },
    { label: 'Login as Super Admin', path: '/admin' },
  ];

  return (
    <footer className="bg-indigo-950 text-indigo-100 py-12 border-t border-indigo-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Admin Login Buttons */}
        <div className="flex flex-wrap justify-center items-center max-md:gap-3 md:gap-6 mb-8">
          {loginLinks.map((link, idx) => (
            <Magnetic key={idx}><button
              onClick={() => navigate(link.path)}
              className="bg-teal-600 hover:bg-teal-500 px-5 py-2 rounded-full text-white text-sm font-medium shadow-md transition-all duration-300"
            >
              {link.label}
            </button></Magnetic>
          ))}
        </div>

        {/* Footer Text */}
        <div className="text-center text-sm text-indigo-200">
          <p><span className="text-white font-semibold">PlaceHub</span> · Campus Placement Portal</p>
        </div>
      </div>
    </footer>
  );
}

export default LandFooter;
