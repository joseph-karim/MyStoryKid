import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateBookPage from './pages/CreateBookPage';
import EditBookPage from './pages/EditBookPage';
import PreviewPage from './pages/PreviewPage';
import DzineStylesList from './scripts/getDzineStylesList';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateBookPage />} />
        <Route path="/edit/:bookId" element={<EditBookPage />} />
        <Route path="/preview/:bookId" element={<PreviewPage />} />
        <Route path="/styles" element={<DzineStylesList />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* Add other routes here later, e.g., signup, book builder, etc. */}
    </Routes>
  )
}

export default App
