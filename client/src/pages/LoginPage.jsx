import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { Google as GoogleIcon, Category as LogoIcon } from '@mui/icons-material';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthContext } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        logger.info('User signed up with email/password');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        logger.info('User signed in with email/password');
      }
      
      navigate(from, { replace: true });
    } catch (err) {
      logger.error('Email/password auth error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      logger.info('User signed in with Google');
      navigate(from, { replace: true });
    } catch (err) {
      logger.error('Google auth error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 3
      }}
    >
      {/* Logo and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <LogoIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
          Wiki-AI
        </Typography>
      </Box>

      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            {isSignUp 
              ? 'Sign up to create your wiki account'
              : 'Sign in to access your wiki'
            }
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Email/Password Form */}
          <Box component="form" onSubmit={handleEmailPasswordAuth} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Google Sign In */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Continue with Google
          </Button>

          {/* Toggle between Sign In and Sign Up */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                sx={{ textDecoration: 'none' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        &copy; {new Date().getFullYear()} Wiki-AI. All rights reserved.
      </Typography>
    </Box>
  );
};

export default LoginPage;
