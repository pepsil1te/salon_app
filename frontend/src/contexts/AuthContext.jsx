import React, { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  // Process the user data from the response
  const processUser = (userData) => {
    // For admin users, salon_id should be null, not tied to any specific salon
    const isAdmin = userData.role === 'admin';
    
    return {
      ...userData,
      isAdmin,
      salon_id: isAdmin ? null : userData.salon_id
    };
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 