import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StiTestList from './StiTestList';
import StiTestForm from './StiTestForm';
import StiTestDetail from './StiTestDetail';

const TestPackages: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<StiTestList />} />
      <Route path="create" element={<StiTestForm />} />
      <Route path="edit/:id" element={<StiTestForm />} />
      <Route path=":id" element={<StiTestDetail />} />
    </Routes>
  );
};

export default TestPackages;