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
import { getEmploymentRecordsApi, getQualificationsApi, getCertificationsApi } from '../api/kycApi';
import { getReferencesApi } from '../api/referenceApi';
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
      let mergedUser = { ...data };

      // Ensure latest employment records are merged and flattened
      try {
        const empRes = await getEmploymentRecordsApi();
        const empData = empRes.data?.data || empRes.data || empRes;
        if (empData) {
          if (Array.isArray(empData.manualRecords) && empData.manualRecords.length > 0) {
            mergedUser.manualEmployment = empData.manualRecords;
          }
          const epfoList = empData.epfoRecords || [];
          const flatEpfo = epfoList
            .flatMap((item) => (Array.isArray(item?.records) ? item.records : (item?.employerName ? [item] : [])))
            .filter(Boolean);
          if (flatEpfo.length > 0) {
            mergedUser.epfoEmployment = flatEpfo;
          }
        }
      } catch (e) {
        // fallback silent
      }

      // Ensure latest qualifications and certifications are merged
      try {
        const [qualRes, certRes] = await Promise.allSettled([
          getQualificationsApi(),
          getCertificationsApi(),
        ]);
        if (qualRes.status === 'fulfilled') {
          const qList = qualRes.value?.data?.data || qualRes.value?.data || [];
          if (Array.isArray(qList) && qList.length > 0) {
            mergedUser.qualifications = qList;
          }
        }
        if (certRes.status === 'fulfilled') {
          const cList = certRes.value?.data?.data || certRes.value?.data || [];
          if (Array.isArray(cList) && cList.length > 0) {
            mergedUser.certifications = cList;
          }
        }
      } catch (e) {
        // fallback silent
      }

      // Ensure latest professional references are merged
      try {
        const refRes = await getReferencesApi();
        const refPayload = refRes?.data || refRes;
        const refList = refPayload?.references || refPayload?.data?.references || [];
        if (Array.isArray(refList)) {
          mergedUser.references = refList;
          mergedUser.verifiedReferencesCount = refList.filter(
            (r) => String(r?.status || '').toUpperCase() === 'COMPLETED' || r?.isFeedbackSubmitted || r?.isPointsAwarded
          ).length;
        }
      } catch (e) {
        // fallback silent
      }

      setProfileUser(mergedUser);
      dispatch(updateUserKycStatus(mergedUser));
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
