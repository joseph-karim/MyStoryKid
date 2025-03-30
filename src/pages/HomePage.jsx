import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toddlerImage from '../assets/toddler.jpg';
import toddlerTransformed from '../assets/toddler transformed.png';
import spaceAdventureCover from '../assets/Space Adventure Cover.png';
import magicalForestCover from '../assets/Magical Forest Cover.png';
import underseaQuestCover from '../assets/Undersea Quest Cover.png';

function HomePage() {
  const [currentArtStyle, setCurrentArtStyle] = useState(0);
  // Store bubble sizes in state to calculate only once
  const [bubbleSizes, setBubbleSizes] = useState([]);

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
              // Use sizes from state
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
                Create magical personalized storybooks featuring your child's name, traits, and interests, brought to life with AI-generated illustrations and engaging storylines.
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

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-b from-white to-purple-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Create a personalized storybook in just a few easy steps</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">1</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Personalize</h3>
              <p className="text-gray-600 text-center">Tell us about your child's name, age, interests, and personality traits to create a truly personal story.</p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">2</div>
              <h3 className="text-2xl font-bold mb-4 text-center">AI Creates</h3>
              <p className="text-gray-600 text-center">Our AI generates a unique story and beautiful illustrations featuring your child as the main character.</p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-xl shadow-xl p-6 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">3</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Enjoy & Share</h3>
              <p className="text-gray-600 text-center">Get your book as a digital download instantly or order a premium printed hardcover delivered to your door.</p>
            </motion.div>
          </div>
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
            <h2 className="text-4xl font-bold mb-4">Magical Stories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover the enchanting world of personalized storybooks</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Book 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group"
            >
              <div className="bg-gradient-to-b from-blue-100 to-blue-200 p-6 rounded-t-xl">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg transform group-hover:scale-105 transition duration-300">
                  <img 
                    src={spaceAdventureCover}
                    alt="Space Adventure book" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-white p-6 rounded-b-xl shadow-xl">
                <h3 className="text-xl font-bold mb-2">Space Adventure</h3>
                <p className="text-gray-600 mb-4">A thrilling journey through the cosmos where your child gets to save an alien planet.</p>
                <Link to="/create" className="text-blue-600 font-medium hover:text-blue-700 transition">Create this story →</Link>
              </div>
            </motion.div>
            
            {/* Book 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group"
            >
              <div className="bg-gradient-to-b from-purple-100 to-purple-200 p-6 rounded-t-xl">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg transform group-hover:scale-105 transition duration-300">
                  <img 
                    src={magicalForestCover}
                    alt="Magical Forest book" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-white p-6 rounded-b-xl shadow-xl">
                <h3 className="text-xl font-bold mb-2">Magical Forest</h3>
                <p className="text-gray-600 mb-4">An enchanting tale where your child discovers magical creatures and hidden treasures.</p>
                <Link to="/create" className="text-purple-600 font-medium hover:text-purple-700 transition">Create this story →</Link>
              </div>
            </motion.div>
            
            {/* Book 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group"
            >
              <div className="bg-gradient-to-b from-amber-100 to-amber-200 p-6 rounded-t-xl">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg transform group-hover:scale-105 transition duration-300">
                  <img 
                    src={underseaQuestCover}
                    alt="Undersea Quest book" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-white p-6 rounded-b-xl shadow-xl">
                <h3 className="text-xl font-bold mb-2">Undersea Quest</h3>
                <p className="text-gray-600 mb-4">A beautiful underwater adventure where your child helps sea creatures and discovers sunken treasures.</p>
                <Link to="/create" className="text-amber-600 font-medium hover:text-amber-700 transition">Create this story →</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-5 left-5 text-6xl">✨</div>
              <div className="absolute bottom-10 right-10 text-6xl">🌟</div>
              <div className="absolute top-1/2 left-1/4 text-5xl">🪄</div>
              <div className="absolute top-1/4 right-1/3 text-5xl">💫</div>
            </div>
            
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Ready to Create Magical Memories?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
              >
                Join thousands of families creating personalized storybooks that inspire a love of reading and capture childhood imagination.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Link 
                  to="/create" 
                  className="inline-block px-8 py-4 bg-white text-purple-600 font-bold rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Create Your First Book
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage; 