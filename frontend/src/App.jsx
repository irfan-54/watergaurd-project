import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import CitizenDashboard from "./pages/CitizenDashboard";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import CreateReport from "./pages/CreateReport";
import EditReport from "./pages/EditReport";
import Analytics from "./pages/Analytics";
import MapPage from "./pages/MapPage";
import TrackReport from "./pages/TrackReport";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import toast from "react-hot-toast";

function App() {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/citizen" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-report" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CreateReport />
            </ProtectedRoute>
          } />
          <Route path="/edit-report/:id" element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <EditReport />
            </ProtectedRoute>
          } />

          <Route path="/department" element={
            <ProtectedRoute allowedRoles={['department']}>
              <DepartmentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          } />

          <Route path="/track/:reportId" element={
            <ProtectedRoute>
              <TrackReport />
            </ProtectedRoute>
          } />

          <Route path="/map" element={<MapPage />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;