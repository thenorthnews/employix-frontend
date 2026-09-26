import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProfileNavbar from '../components/common/ProfileNavbar';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileMainCards from '../components/profile/ProfileMainCards';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import Footer from '../components/common/Footer';
import ButtonSpinner from '../components/common/Loader';
import { getProfileApi } from '../api/authApi';
import { updateUserKycStatus } from '../redux/slices/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const [profileUser, setProfileUser] = useState(authUser || null);
  const [loading, setLoading] = useState(!authUser);

  const fetchProfile = async () => {
    try {
      const res = await getProfileApi();
      const data = res.data?.data || res.data || res;
      if (data) {
        setProfileUser(data);
        dispatch(updateUserKycStatus(data));
      }
    } catch (err) {
      console.warn('Could not fetch latest profile from /users/me:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [dispatch]);

  return (
    <>
      <ProfileNavbar onUpdate={fetchProfile} />
      <main className="flex-grow-1">
        {/* Top Page Banner */}
        {/* <div className="auth-top-banner text-center position-relative">
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
          <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <h1 className="page-banner-title">
              Verified Profile <span className="text-teal">Dashboard</span>
            </h1>
            <div className="banner-breadcrumb justify-content-center d-flex align-items-center">
              <Link to="/">Home</Link>
              <span className="banner-breadcrumb-separator mx-2"></span>
              <span className="text-white">Profile Dashboard</span>
            </div>
          </div>
        </div> */}

        {/* Main Profile Content Section */}
        <section className="profile-section py-5 position-relative overflow-hidden">
          <div className="patern-layer-one" style={{ backgroundImage: 'url(/images/download-23.png)', zIndex: 0 }}></div>
          <div className="hero-glow-orb orb-teal" aria-hidden="true"></div>
          <div className="hero-glow-orb orb-blue" aria-hidden="true"></div>

          <div className="container position-relative" style={{ zIndex: 2 }}>
            {loading && !profileUser ? (
              <div className="text-center py-5">
                <ButtonSpinner text="Loading Verified Profile..." />
              </div>
            ) : (
              <>
                {/* User Header Hero Card */}
                <ProfileHeader user={profileUser} onUpdate={fetchProfile} />

                {/* Two-Column Main Profile Dashboard Layout */}
                <div className="row g-4">
                  <ProfileMainCards user={profileUser} onUpdate={fetchProfile} />
                  <ProfileSidebar user={profileUser} references={profileUser?.references} />
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProfilePage;
