import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import About from './pages/About';
import Services from './pages/Services';


// Public Pages
import Home from './pages/Home';
import Projects from './pages/Projects';
import Internship from './pages/Internship';
import InternshipDetails from './pages/InternshipDetails';
import Careers from './pages/Careers';
import CareerDetails from './pages/CareerDetails';
import AdminJobForm from './pages/AdminJobForm';
import AdminEditJob from './pages/AdminEditJob';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Courses from './pages/Courses';

// User Section
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

// Admin Panel
import AdminDashboard from './pages/admin/AdminDashboard';
import ApplicationManagement from './pages/admin/ApplicationManagement';
import UserLookup from './pages/admin/UserLookup';
import ApiSettings from './pages/admin/ApiSettings';
import AdminLayout from './components/AdminLayout';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'admin' | 'user' }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] font-display text-xl font-bold italic tracking-tighter">AUTHENTICATING...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // User trying to access admin routes
  if (role === 'admin' && !isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();
  
    useEffect(() => {
    if (
      location.pathname.includes('/admin/jobs/edit/') ||
      location.pathname.includes('/admin/jobs/new')
    ) {
      return;
    }

    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const titles: { [key: string]: string } = {
      '/': 'C FOUND | Premier Indian Game & Software Studio',
      '/about': 'About | C FOUND Technology',
      '/services': 'Services | C FOUND Solutions',
      '/projects': 'Portfolio | C FOUND Digital Works',
      '/internship': 'Training Labs | Graduate Engineering @ C FOUND',
      '/careers': 'Fleet Careers | Join C FOUND India',
      '/blog': 'Research Journal | C FOUND Insights',
      '/courses': 'Academy | Skill Procurement Sector',
      '/contact': 'Protocol Contact | C FOUND Studio',
      '/login': 'Secure Access | C FOUND Console',
      '/admin': 'Command Center | C FOUND Admin',
      '/dashboard': 'User Terminal | C FOUND Dashboard',
      '/profile': 'Engineer Profile | C FOUND System',
    };
    
    const pageTitle = titles[location.pathname] || 'C FOUND | Digital Worlds';
    document.title = pageTitle;
  }, [location]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Toaster position="bottom-right" toastOptions={{
        className: 'glass text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] border-[var(--border-main)] rounded-2xl',
        duration: 4000,
      }} />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/internship" element={<Internship />} />
          <Route path="/internship/:slug" element={<InternshipDetails />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:slug" element={<CareerDetails />} />
          <Route path="/admin/jobs/new" element={ <ProtectedRoute role="admin"><AdminJobForm /></ProtectedRoute>}/>
          <Route path="/admin/jobs/edit/:id" element={ <ProtectedRoute role="admin"><AdminEditJob /></ProtectedRoute>}/>
          <Route path="/blog" element={<Blog />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />

          {/* User Section */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute role="admin"><AdminLayout><ApplicationManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminLayout><UserLookup /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/api-settings" element={<ProtectedRoute role="admin"><AdminLayout><ApiSettings /></AdminLayout></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
