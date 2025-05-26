import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toddlerImage from '../assets/toddler.jpg';
import toddlerTransformed from '../assets/toddler transformed.png';
import spaceAdventureCover from '../assets/space-adventure-cover.png';
import magicalForestCover from '../assets/magical-forest-cover.png';
import underseaQuestCover from '../assets/undersea-quest-cover.png';
import GuestFeatureIndicator from '../components/GuestFeatureIndicator';
import useAuthStore from '../store/useAuthStore';

function HomePage() {
  const [currentArtStyle, setCurrentArtStyle] = useState(0);
  // Store bubble sizes in state to calculate only once
  const [bubbleSizes, setBubbleSizes] = useState([]);
  const { isAuthenticated, isAnonymous } = useAuthStore();

  const characterStyles = [
    {
      name: 'Whimsical',
      imageUrl: toddlerTransformed,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Adventure',
      imageUrl: toddlerTransformed,
      color: 'from-blue-500 to-teal-400'
    },
    {
      name: 'Fantasy',
      imageUrl: toddlerTransformed,
      color: 'from-amber-500 to-red-500'
    },
    {
      name: 'Cosmic',
      imageUrl: toddlerTransformed,
      color: 'from-indigo-600 to-purple-600'
    }
  ];

  // Pre-define fixed positions for background bubbles
  const bubblePositions = [
    { x: '10%', y: '10%' }, { x: '80%', y: '15%' }, { x: '25%', y: '30%' },
    { x: '70%', y: '40%' }, { x: '15%', y: '60%' }, { x: '65%', y: '70%' },
    { x: '35%', y: '85%' }, { x: '85%', y: '80%' }, { x: '45%', y: '20%' },
    { x: '90%', y: '40%' }, { x: '5%', y: '75%' }, { x: '40%', y: '60%' },
    { x: '60%', y: '30%' }, { x: '20%', y: '45%' }, { x: '50%', y: '90%' },
  ];

  // Calculate bubble sizes once on mount
  useEffect(() => {
    setBubbleSizes(
      bubblePositions.map(() => ({
        width: `${Math.random() * 100 + 50}px`,
        height: `${Math.random() * 100 + 50}px`
      }))
    );
  }, []); // Empty dependency array ensures this runs only once

  // Auto-rotate art styles
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentArtStyle((prev) => (prev + 1) % characterStyles.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [characterStyles.length]);

  return (
    <div className="space-y-16 overflow-hidden">
      {/* Static Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {bubblePositions.map((position, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-b opacity-20 ${
              i % 3 === 0 ? 'from-purple-400 to-pink-300' : 
              i % 3 === 1 ? 'from-blue-400 to-teal-300' : 
              'from-amber-400 to-red-300'
            }`}
            style={{
              left: position.x,
              top: position.y,
              width: bubbleSizes[i]?.width || '50px', 
              height: bubbleSizes[i]?.height || '50px'
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 lg:pt-20 pb-16 lg:pb-24 overflow-hidden">
        <motion.div 
          className="container mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Turn Your Child Into A Storybook Hero
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-gray-700 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                 Create magical, personalized storybooks in minutes! Answer a few simple questions or dive deep into customization. Our AI generates unique stories and illustrations, starring your child. Choose digital or print!
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <Link 
                  to="/create" 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Create Your Story
                </Link>
                <Link 
                  to="/dashboard" 
                  className="px-8 py-4 bg-white text-purple-600 font-bold rounded-full shadow-md border border-purple-200 transform transition duration-300 hover:scale-105 hover:shadow-lg"
                >
                  My Books
                </Link>
              </motion.div>
            </div>
            
            {/* Character Transformation Showcase */}
            <div className="flex justify-center">
              {/* Container with adjusted height */}
              <motion.div 
                className="relative w-full max-w-lg h-80 sm:h-96 md:h-[28rem]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                {/* Real photo frame - Moved further left */}
                <div className="absolute left-0 md:left-5 top-5 z-10 rounded-lg shadow-xl bg-white p-2 w-40 md:w-56 rotate-3">
                  <img 
                    src={toddlerImage}
                    alt="Real child" 
                    className="rounded w-full h-auto"
                  />
                  <div className="absolute -bottom-2 left-0 right-0 text-center text-sm font-handwriting">Your Child</div>
                </div>
                
                {/* Stylized Arrow */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-4xl md:text-5xl text-purple-500 drop-shadow-md"
                >
                  ➜
                </div>
                
                {/* Transformed character - Moved further right, removed rotating frame */}
                <div className="absolute right-0 md:right-5 top-16 z-10 rounded-lg shadow-xl bg-gradient-to-br from-purple-200 to-pink-200 p-2 w-40 md:w-56 -rotate-6 aspect-[3/4]">
                  <img 
                    src={toddlerTransformed} 
                    alt="Transformed Character" 
                    className="rounded w-full h-full object-contain"
                  />
                  <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-white font-semibold bg-black/40 rounded-b py-0.5">
                    Storybook Hero
                      </div>
                </div>
                
                {/* Background blur effect */}
                <div 
                  className="absolute -z-10 w-full h-full bg-gradient-to-r from-purple-200 to-pink-200 rounded-full blur-3xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Static floating magical elements */}
        <div className="absolute top-20 left-10 z-0 text-5xl">✨</div>
        <div className="absolute bottom-20 right-10 z-0 text-5xl">🌟</div>
        <div className="absolute top-1/2 right-1/4 z-0 text-3xl">🌈</div>
      </section>

      {/* Guest Feature Indicator */}
      {(!isAuthenticated || isAnonymous) && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <GuestFeatureIndicator compact={true} />
          </div>
        </section>
      )}

      {/* Features / How to Create Section */}
      <section className="py-16 bg-white">
         <div className="container mx-auto px-4">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.7 }}
               viewport={{ once: true, margin: "-100px" }}
               className="text-center mb-16"
             >
               <h2 className="text-4xl font-bold mb-4">Your Story, Your Way</h2>
               <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the creation path that works best for you.</p>
             </motion.div>

             <div className="grid md:grid-cols-2 gap-10">
                 {/* Quick Wizard */}
                 <motion.div
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.7, delay: 0.1 }}
                   viewport={{ once: true, margin: "-100px" }}
                   className="border border-purple-200 rounded-xl shadow-lg p-8 bg-purple-50"
                 >
                    <div className="flex items-center mb-4">
                        <span className="text-4xl mr-4">🚀</span>
                        <h3 className="text-2xl font-bold text-purple-800">Quick & Easy Wizard</h3>
                    </div>
                    <p className="text-gray-700 mb-4">Answer a few simple questions about your child, choose a theme, and let our AI work its magic! Get a beautiful, personalized story in minutes.</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                        <li>Fastest way to create</li>
                        <li>Great for gifts and quick reads</li>
                        <li>AI handles the details</li>
                    </ul>
                     <Link 
                       to="/create" // Link to start the wizard
                       className="inline-block mt-2 px-6 py-2 bg-purple-600 text-white font-semibold rounded-full shadow transform transition duration-300 hover:bg-purple-700 hover:scale-105"
                     >
                       Start Quick Wizard
                     </Link>
                 </motion.div>



                 {/* Full Customization */}
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.7, delay: 0.2 }}
                   viewport={{ once: true, margin: "-100px" }}
                    className="border border-blue-200 rounded-xl shadow-lg p-8 bg-blue-50"
                 >
                     <div className="flex items-center mb-4">
                         <span className="text-4xl mr-4">🎨</span>
                         <h3 className="text-2xl font-bold text-blue-800">Detailed Customization</h3>
                     </div>
                     <p className="text-gray-700 mb-4">Take full control! Define the story type, plot points, characters, art style, narrative voice, and more. Perfect for crafting a truly unique tale.</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                        <li>Fine-tune every aspect</li>
                        <li>Ideal for specific lessons or ideas</li>
                        <li>Maximum creative freedom</li>
                    </ul>
                     <Link 
                       to="/create" // Link to start the wizard (which now includes detailed path)
                       className="inline-block mt-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow transform transition duration-300 hover:bg-blue-700 hover:scale-105"
                     >
                       Customize Your Story
                     </Link>
                 </motion.div>
             </div>
         </div>
      </section>

      {/* How It Works (Simplified & Refocused) */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">From Idea to Keepsake</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Personalize */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">1</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Tell Us Your Vision</h3>
              <p className="text-gray-600 text-center">Use our simple wizard to provide details about your child, the story theme, desired style, and more.</p>
            </motion.div>
            
            {/* Step 2: AI Creates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">2</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Watch the Magic Happen</h3>
              <p className="text-gray-600 text-center">Our advanced AI crafts a unique story and generates beautiful, consistent illustrations based on your input.</p>
            </motion.div>
            
            {/* Step 3: Choose Format */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">3</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Digital or Print</h3>
              <p className="text-gray-600 text-center">Preview your creation instantly. Choose a digital download or order a premium printed hardcover book delivered to your door.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
               className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-lg p-8 border border-blue-200"
             >
                  <div className="text-blue-500 text-6xl mr-8 mb-4 md:mb-0">🔒</div>
                  <div>
                     <h2 className="text-3xl font-bold mb-3 text-blue-800">Your Privacy Matters</h2>
                     <p className="text-lg text-gray-700 mb-2">
                         We take your child's privacy seriously. If you choose to upload a photo for character styling:
                     </p>
                     <ul className="list-disc list-inside text-gray-600 space-y-1">
                         <li>Photos are used <strong className='font-semibold'>only once</strong> during the AI generation process to create a unique artistic representation.</li>
                         <li>Your original photo is <strong className='font-semibold'>never stored</strong> on our servers after the style is confirmed.</li>
                         <li>We are committed to protecting your data and ensuring a safe experience.</li>
                     </ul>
              </div>
            </motion.div>
        </div>
      </section>

      {/* Sample Books */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Inspiring Adventures Await</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Explore some of the magical stories created with MyStoryKid</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
             {/* Sample Book 1 */}
            <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-lg shadow-lg overflow-hidden group"
             >
               <img src={spaceAdventureCover} alt="Space Adventure Book Cover" className="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110"/>
               <div className="p-4">
                 <h3 className="font-bold text-lg mb-2">Leo's Cosmic Quest</h3>
                 <p className="text-sm text-gray-600">A journey through the stars to find a friendly alien.</p>
              </div>
            </motion.div>
             {/* Sample Book 2 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-lg shadow-lg overflow-hidden group"
             >
               <img src={magicalForestCover} alt="Magical Forest Book Cover" className="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110"/>
               <div className="p-4">
                 <h3 className="font-bold text-lg mb-2">Maya and the Whispering Woods</h3>
                 <p className="text-sm text-gray-600">Discovering secrets with magical forest creatures.</p>
              </div>
            </motion.div>
             {/* Sample Book 3 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-lg shadow-lg overflow-hidden group"
             >
               <img src={underseaQuestCover} alt="Undersea Quest Book Cover" className="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110"/>
               <div className="p-4">
                 <h3 className="font-bold text-lg mb-2">Sammy's Submarine Surprise</h3>
                 <p className="text-sm text-gray-600">Exploring coral reefs and meeting colorful fish.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            Ready to Create Magic?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 max-w-xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            Start crafting a unique storybook today and give a gift that lasts a lifetime.
              </motion.p>
              <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             viewport={{ once: true, margin: "-50px" }}
              >
                <Link 
                  to="/create" 
              className="px-10 py-4 bg-white text-purple-600 font-bold rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl"
                >
              Start Creating Now
                </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage; 