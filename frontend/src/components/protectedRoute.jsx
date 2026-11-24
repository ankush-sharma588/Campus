import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/useUser';
import Loading from './Loading';

const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  tpo_admin: '/tpo/dashboard',
  management_admin: '/management/dashboard',
  superuser: '/admin/dashboard',
};

const PROFILE_COMPLETION_ROUTES = {
  student: (user) => `/student/complete-profile/${user.id}`,
  tpo_admin: (user) => `/tpo/complete-profile/${user.id}`,
  management_admin: (user) => `/management/complete-profile/${user.id}`,
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) return <Loading />;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] || '/404'} replace />;
  }

  const profileCompletionRoute = PROFILE_COMPLETION_ROUTES[user.role];
  if (user.isProfileCompleted === 'false' && profileCompletionRoute) {
    const requiredPath = profileCompletionRoute(user);
    // The completion form itself is protected too; allow it to render while
    // redirecting every other route until the profile has been completed.
    if (location.pathname !== requiredPath) {
      return <Navigate to={requiredPath} replace />;
    }
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;
