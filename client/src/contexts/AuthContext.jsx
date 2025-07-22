import { onAuthStateChanged, signOut } from 'firebase/auth';
import PropTypes from 'prop-types';
import { createContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get server URL from environment
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);

        if (firebaseUser) {
          // Get the Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Fetch user data from your backend
          const response = await fetch(`${serverUrl}/api/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...userData.data,
              firebaseUser: firebaseUser
            });
            logger.info('User authenticated successfully', { userId: userData.data.id });
          } else if (response.status === 404) {
            // User doesn't exist in our database, create them
            const createResponse = await fetch(`${serverUrl}/api/auth/register`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email,
                profileImage: firebaseUser.photoURL
              })
            });

            if (createResponse.ok) {
              const newUserData = await createResponse.json();
              setUser({
                ...newUserData.data,
                firebaseUser: firebaseUser
              });
              logger.info('New user created successfully', { userId: newUserData.data.id });
            } else {
              throw new Error('Failed to create user account');
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } else {
          setUser(null);
          logger.info('User signed out');
        }
      } catch (err) {
        logger.error('Authentication error', { error: err.message });
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [serverUrl]);

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setError(null);
      logger.info('User logged out successfully');
    } catch (err) {
      logger.error('Logout error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updateData) => {
    try {
      if (!user) throw new Error('No user logged in');

      const idToken = await user.firebaseUser.getIdToken();
      const response = await fetch(`${serverUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUserData = await response.json();
        setUser({
          ...updatedUserData.data,
          firebaseUser: user.firebaseUser
        });
        logger.info('User profile updated successfully', { userId: user.id });
        return updatedUserData.data;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      logger.error('Profile update error', { error: err.message });
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    logout,
    updateUserProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
