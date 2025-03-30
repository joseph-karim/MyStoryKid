import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { motion } from 'framer-motion';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  // Change header style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Logo animation variants
  const logoVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { 
        type: "spring", 
        stiffness: 400,
        damping: 10
      }
    }
  };
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/">
            <motion.div 
              className="flex items-center"
              variants={logoVariants}
              initial="initial"
              whileHover="hover"
            >
              <span className="text-3xl mr-1">✨</span>
              <h1 className={`text-2xl font-bold ${isScrolled ? 'text-purple-600' : 'text-purple-600'}`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600">
                  MyStoryKid
                </span>
              </h1>
            </motion.div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/dashboard" isActive={location.pathname === '/dashboard'}>
              My Books
            </NavLink>
            <NavLink to="/create" isActive={location.pathname === '/create'}>
              Create Story
            </NavLink>
            
            {isAuthenticated ? (
              <div className="relative group ml-4">
                <motion.div 
                  className="flex items-center cursor-pointer bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                  <span className="ml-2">👤</span>
                </motion.div>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                  <div className="py-2">
                    <Link 
                      to="/dashboard" 
                      className="block px-4 py-2 text-gray-800 hover:bg-purple-50"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/" 
                      className="block px-4 py-2 text-gray-800 hover:bg-purple-50"
                      onClick={() => {
                        // We'd add logout logic here eventually
                      }}
                    >
                      Sign Out
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center ml-4">
                <Link to="/login">
                  <motion.button 
                    className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-full shadow-md"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </Link>
              </div>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none transition-colors ${isScrolled || isMobileMenuOpen ? 'text-purple-600' : 'text-purple-600'}`}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div 
          className="md:hidden bg-white shadow-lg py-4 px-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <nav className="flex flex-col space-y-3">
            <Link 
              to="/dashboard"
              className="text-gray-800 hover:text-purple-600 py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Books
            </Link>
            <Link 
              to="/create"
              className="text-gray-800 hover:text-purple-600 py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Story
            </Link>
            
            {isAuthenticated ? (
              <Link 
                to="/"
                className="text-gray-800 hover:text-purple-600 py-2 font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  // We'd add logout logic here eventually
                }}
              >
                Sign Out
              </Link>
            ) : (
              <Link 
                to="/login"
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 px-4 rounded-full text-center font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </motion.div>
      )}
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
      
      {/* Magical sparkles */}
      <div className="hidden md:block absolute top-1/2 left-1/3 -translate-y-1/2 text-lg animate-float-slow">✨</div>
      <div className="hidden md:block absolute top-1/4 right-1/4 text-lg animate-float-slow delay-300">🌟</div>
    </header>
  );
}

// Custom NavLink component with animation
function NavLink({ children, to, isActive }) {
  return (
    <Link to={to}>
      <div className="relative px-3 py-2">
        <span className={`relative z-10 font-medium ${isActive ? 'text-white' : 'text-gray-700 hover:text-purple-600'}`}>
          {children}
        </span>
        
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            layoutId="navBackground"
            initial={{ borderRadius: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          />
        )}
      </div>
    </Link>
  );
}

export default Header; 