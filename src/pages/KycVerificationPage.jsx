import React from 'react';
import ProfileNavbar from '../components/common/ProfileNavbar';
import Footer from '../components/common/Footer';
import KYCVerification from '../components/kyc/KYCVerification';

const KycVerificationPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ProfileNavbar />
      <KYCVerification />
      <Footer />
    </div>
  );
};

export default KycVerificationPage;
