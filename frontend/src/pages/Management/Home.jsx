import usePageTitle from '../../hooks/usePageTitle.js';
import NoticeBox from '../../components/NoticeBox';
import NotificationBox from '../../components/NotificationBox';

// management
function Home() {
  usePageTitle("PlaceHub | Management Dashboard");
  return (
    <>
      <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
        <NotificationBox />
        <NoticeBox />
      </div>
    </>
  )
}

export default Home
