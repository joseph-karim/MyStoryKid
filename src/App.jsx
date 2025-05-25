import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateBookPage from './pages/CreateBookPage';
import EditBookPage from './pages/EditBookPage';
import PreviewPage from './pages/PreviewPage';
import DzineStylesList from './scripts/getDzineStylesList';
import GenerateBookWrapper from './components/wizard/GenerateBookWrapper';
import DigitalDownloadPage from './pages/DigitalDownloadPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateBookPage />} />
        <Route path="/book/:bookId" element={<PreviewPage />} />
        <Route path="/styles" element={<DzineStylesList />} />
        <Route path="/generate-book" element={<GenerateBookWrapper />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireAuth={true} allowGuest={false}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/edit/:bookId" element={
          <ProtectedRoute requireAuth={true} allowGuest={false}>
            <EditBookPage />
          </ProtectedRoute>
        } />
        <Route path="/download/:downloadId" element={
          <ProtectedRoute requireAuth={true} allowGuest={false}>
            <DigitalDownloadPage />
          </ProtectedRoute>
        } />
        <Route path="/account/downloads" element={
          <ProtectedRoute requireAuth={true} allowGuest={false}>
            <DashboardPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* Add other routes here later, e.g., signup, book builder, etc. */}
    </Routes>
  )
}

export default App
