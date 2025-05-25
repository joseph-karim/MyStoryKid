import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, LockClosedIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../store/useAuthStore';
import AuthModal from './AuthModal';

/**
 * Component that shows guest users what features they can access
 * and what requires an account, with upgrade prompts
 */
const GuestFeatureIndicator = ({ compact = false, showUpgradeButton = true }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isAnonymous } = useAuthStore();

  // Don't show for authenticated non-anonymous users
  if (isAuthenticated && !isAnonymous) {
    return null;
  }

  const guestFeatures = [
    {
      name: "Create Stories",
      description: "Generate personalized stories with AI",
      available: true,
      icon: CheckIcon
    },
    {
      name: "Preview Books",
      description: "See your story come to life with illustrations",
      available: true,
      icon: CheckIcon
    },
    {
      name: "Character Creation",
      description: "Design custom characters for your stories",
      available: true,
      icon: CheckIcon
    }
  ];

  const premiumFeatures = [
    {
      name: "Save Books",
      description: "Keep your stories in your personal library",
      available: false,
      icon: LockClosedIcon
    },
    {
      name: "Download PDFs",
      description: "Get high-quality PDF versions of your books",
      available: false,
      icon: LockClosedIcon
    },
    {
      name: "Order Prints",
      description: "Turn your digital stories into physical books",
      available: false,
      icon: LockClosedIcon
    },
    {
      name: "Multiple Books",
      description: "Create unlimited stories and build your collection",
      available: false,
      icon: LockClosedIcon
    }
  ];

  const handleUpgrade = () => {
    setShowAuthModal(true);
  };

  if (compact) {
    return (
      <>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserPlusIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  You're browsing as a guest
                </h3>
                <p className="text-sm text-amber-700">
                  Create a free account to save your books and unlock more features
                </p>
              </div>
            </div>
            {showUpgradeButton && (
              <button
                onClick={handleUpgrade}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Sign Up Free
              </button>
            )}
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          mode="signup"
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-4">
            <UserPlusIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Guest Access
          </h3>
          <p className="text-gray-600">
            You're currently browsing as a guest. Here's what you can do:
          </p>
        </div>

        {/* Available Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
            <CheckIcon className="h-4 w-4 mr-2" />
            Available Now
          </h4>
          <div className="space-y-3">
            {guestFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <feature.icon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Premium Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center">
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Unlock with Free Account
          </h4>
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="flex items-start space-x-3 opacity-75"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.75, x: 0 }}
                transition={{ delay: (guestFeatures.length + index) * 0.1 }}
              >
                <feature.icon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{feature.name}</p>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upgrade Button */}
        {showUpgradeButton && (
          <motion.button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Free Account
          </motion.button>
        )}

        {/* Additional Info */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Free forever • No credit card required • Instant access
          </p>
        </div>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        mode="signup"
      />
    </>
  );
};

export default GuestFeatureIndicator; 