import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * SystemSettingsPage has been removed per user request.
 */
export const SystemSettingsPage: React.FC = () => {
  return <Navigate to="/app" replace />;
};
