import React from 'react';
import { useSelector } from 'react-redux';
import EmployeeScoringCard from './EmployeeScoringCard';

const ProfileSidebar = ({ user: propUser, references = null }) => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const user = propUser || reduxUser;

  return (
    <div className="col-lg-4">
      <EmployeeScoringCard user={user} references={references} showActionBtn={true} />
    </div>
  );
};

export default ProfileSidebar;

