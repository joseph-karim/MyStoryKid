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

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateBookPage />} />
        <Route path="/edit/:bookId" element={<EditBookPage />} />
        <Route path="/book/:bookId" element={<PreviewPage />} />
        <Route path="/styles" element={<DzineStylesList />} />
        <Route path="/generate-book" element={<GenerateBookWrapper />} />
        <Route path="/download/:downloadId" element={<DigitalDownloadPage />} />
        <Route path="/account/downloads" element={<DashboardPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* Add other routes here later, e.g., signup, book builder, etc. */}
    </Routes>
  )
}

export default App
