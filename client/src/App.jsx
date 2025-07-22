import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';

// Import your page components (create these as needed)
import AdminSettingsPage from './pages/admin/SettingsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import CategoriesPage from './pages/CategoriesPage';
import Dashboard from './pages/Dashboard';
import DocumentEditor from './pages/DocumentEditor';
import DocumentsPage from './pages/DocumentsPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';

// Admin pages

function App() {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <MainLayout>
                    <Navigate to="/dashboard" replace />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/dashboard" element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/documents" element={
                <PrivateRoute>
                  <MainLayout>
                    <DocumentsPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/documents/new" element={
                <PrivateRoute>
                  <MainLayout>
                    <DocumentEditor />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/documents/:id" element={
                <PrivateRoute>
                  <MainLayout>
                    <DocumentEditor />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/categories" element={
                <PrivateRoute>
                  <MainLayout>
                    <CategoriesPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/favorites" element={
                <PrivateRoute>
                  <MainLayout>
                    <FavoritesPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/search" element={
                <PrivateRoute>
                  <MainLayout>
                    <SearchPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </PrivateRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/users" element={
                <PrivateRoute requireAdmin>
                  <MainLayout>
                    <AdminUsersPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              <Route path="/admin/settings" element={
                <PrivateRoute requireAdmin>
                  <MainLayout>
                    <AdminSettingsPage />
                  </MainLayout>
                </PrivateRoute>
              } />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
