import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Main content with padding to account for fixed header */}
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}

export default Layout; 