import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsultantDashboard from './ConsultantDashboard';
import AppointmentManagement from './AppointmentManagement';
import WeeklyScheduleManager from './WeeklyScheduleManager';
import ConsultantSchedule from './ConsultantSchedule';

const ConsultantRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ConsultantDashboard />} />
      <Route path="/appointments" element={<AppointmentManagement />} />
      <Route path="/weekly-schedule" element={<WeeklyScheduleManager />} />
      <Route path="/schedule" element={<ConsultantSchedule />} />
    </Routes>
  );
};

export default ConsultantRoutes;