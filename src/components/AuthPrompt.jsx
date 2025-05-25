import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';
import useAuthStore from '../store/useAuthStore';

/**
 * Component that prompts users to create an account before book generation
 * Shows the benefits of having an account vs continuing as guest
 */
const AuthPrompt = ({ onContinue, onSkip, title = "Create Your Account" }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isAnonymous } = useAuthStore();

  // If user is already authenticated (and not anonymous), don't show this prompt
  if (isAuthenticated && !isAnonymous) {
    onContinue?.();
    return null;
  }

  const benefits = [
    {
      icon: "💾",
      title: "Save Your Books",
      description: "Access your personalized stories anytime, anywhere"
    },
    {
      icon: "📚",
      title: "Build Your Library",
      description: "Create multiple books and track your collection"
    },
    {
      icon: "🎨",
      title: "Character Gallery",
      description: "Save character designs for future stories"
    },
    {
      icon: "📱",
      title: "Download & Share",
      description: "Get high-quality PDFs and share with family"
    },
    {
      icon: "🛒",
      title: "Order Prints",
      description: "Turn your digital stories into beautiful physical books"
    },
    {
      icon: "⚡",
      title: "Faster Creation",
      description: "Skip setup steps with saved preferences"
    }
  ];

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onContinue?.();
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="text-6xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              ✨
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create an account to unlock the full magic of MyStoryKid and keep your personalized stories forever
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Free Account
            </motion.button>
            
            <motion.button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 px-8 py-4 rounded-2xl font-medium transition-colors min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue as Guest
            </motion.button>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Free forever • No credit card required • Create unlimited stories
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 text-2xl opacity-20 animate-float-slow">🌟</div>
          <div className="absolute top-20 right-16 text-2xl opacity-20 animate-float-slow delay-300">✨</div>
          <div className="absolute bottom-16 left-20 text-2xl opacity-20 animate-float-slow delay-700">🎨</div>
          <div className="absolute bottom-10 right-10 text-2xl opacity-20 animate-float-slow delay-500">📚</div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode="signup"
      />
    </>
  );
};

export default AuthPrompt; 