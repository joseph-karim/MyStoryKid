import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Magical floating elements */}
        <div className="absolute top-10 left-[10%] text-4xl animate-float-slow">✨</div>
        <div className="absolute bottom-20 right-[5%] text-4xl animate-float-slow delay-700">🌟</div>
        <div className="absolute top-1/4 right-1/3 text-3xl animate-spin-slow">💫</div>
        <div className="absolute bottom-1/3 left-1/4 text-3xl animate-float-slow delay-300">🪄</div>
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-blue-500 rounded-full opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-purple-500 rounded-full opacity-10 blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and tagline */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center">
              <span className="text-3xl mr-1">✨</span>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400">
                MyStoryKid
              </span>
            </Link>
            <p className="mt-4 text-blue-200 max-w-md">
              Creating magical personalized storybooks that spark imagination and foster a love of reading in children.
            </p>
            
            {/* Social links */}
            <div className="flex mt-6 space-x-4">
              {['facebook', 'twitter', 'instagram', 'pinterest'].map(social => (
                <motion.a 
                  key={social}
                  href={`https://${social}.com`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
                  whileHover={{ y: -3 }}
                >
                  {social[0].toUpperCase()}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-blue-300">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'My Books', path: '/dashboard' },
                { name: 'Create Story', path: '/create' },
                { name: 'Sign In', path: '/login' },
              ].map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-blue-200 hover:text-white transition hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Help & Support */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-blue-300">Help & Support</h3>
            <ul className="space-y-2">
              {[
                { name: 'FAQs', path: '#' },
                { name: 'Shipping', path: '#' },
                { name: 'Contact Us', path: '#' },
                { name: 'Privacy Policy', path: '#' },
              ].map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-blue-200 hover:text-white transition hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="mt-12 bg-white/5 rounded-xl p-6 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Join Our Magical Newsletter</h3>
            <p className="text-blue-200">Get exclusive offers, creative inspiration, and updates on new story themes!</p>
          </div>
          
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow px-4 py-3 rounded-full bg-white/10 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
          </form>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center text-blue-300 text-sm">
          <p>© {new Date().getFullYear()} MyStoryKid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 