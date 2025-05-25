import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession, validateShopifyConfig } from '../services/shopifyService';
import { generateBookPDF } from '../services/digitalDownloadService';
import { 
  analyzeBookImages, 
  getEnhancementCostEstimate,
  checkPrintEnhancementService 
} from '../services/printReadyBookService';
import useAuthStore from '../store/useAuthStore';

/**
 * Component for displaying book purchase options (digital download or print)
 */
const BookPurchaseOptions = ({ book }) => {
  const [selectedOption, setSelectedOption] = useState('digital');
  const [shippingOption, setShippingOption] = useState('standard');
  const [printEnhancement, setPrintEnhancement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [enhancementCost, setEnhancementCost] = useState(null);
  const [enhancementServiceStatus, setEnhancementServiceStatus] = useState(null);
  const [shopifyConfig, setShopifyConfig] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Analyze images for print quality and check Shopify config on component mount
  useEffect(() => {
    const analyzeImages = async () => {
      try {
        const [analysis, costEstimate, serviceStatus] = await Promise.all([
          analyzeBookImages(book),
          getEnhancementCostEstimate(book),
          checkPrintEnhancementService()
        ]);
        
        setImageAnalysis(analysis);
        setEnhancementCost(costEstimate);
        setEnhancementServiceStatus(serviceStatus);
        
        // Auto-enable enhancement if images need it and service is available
        if (analysis.imagesNeedingEnhancement > 0 && serviceStatus.available) {
          setPrintEnhancement(true);
        }
      } catch (error) {
        console.error('Error analyzing images:', error);
      }
    };

    const checkShopifyConfig = () => {
      const config = validateShopifyConfig();
      setShopifyConfig(config);
    };

    if (book) {
      analyzeImages();
      checkShopifyConfig();
    }
  }, [book]);

  // Handle option selection
  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  // Handle shipping option selection
  const handleShippingOptionChange = (option) => {
    setShippingOption(option);
  };

  // Handle print enhancement toggle
  const handlePrintEnhancementChange = (enabled) => {
    setPrintEnhancement(enabled);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    let basePrice = selectedOption === 'digital' ? 10 : 24.99;
    let shippingCost = selectedOption === 'print' && shippingOption === 'expedited' ? 9.99 : 0;
    let enhancementCost = selectedOption === 'print' && printEnhancement ? (enhancementCost?.totalCost || 0) : 0;
    
    return basePrice + shippingCost + enhancementCost;
  };

  // Handle purchase button click
  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        // Redirect to login page with return URL
        navigate('/login?redirect=' + encodeURIComponent(`/book/${book.id}`));
        return;
      }

      if (selectedOption === 'digital') {
        // For digital option, create Shopify checkout session
        const checkoutSession = await createCheckoutSession(book, 'digital');
        window.location.href = checkoutSession.checkoutUrl;
      } else {
        // For print option, include enhancement option in the variant
        let variant = shippingOption === 'expedited' ? 'print-expedited' : 'print-standard';
        if (printEnhancement) {
          variant += '-enhanced';
        }
        
        const checkoutSession = await createCheckoutSession(book, variant, {
          printEnhancement,
          enhancementCost: enhancementCost?.totalCost || 0
        });
        window.location.href = checkoutSession.checkoutUrl;
      }
    } catch (error) {
      console.error('Error initiating purchase:', error);
      setError('Sorry, there was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle preview PDF generation
  const handlePreviewPDF = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a preview PDF
      const pdfUrl = await generateBookPDF(book);

      // Open the PDF in a new tab
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      setError('Sorry, there was an error generating the preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="book-purchase-options" className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Purchase Options</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Digital Download Option */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'digital'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => handleOptionChange('digital')}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="purchaseOption"
              checked={selectedOption === 'digital'}
              onChange={() => handleOptionChange('digital')}
              className="mt-1 mr-2"
            />
            <div>
              <h3 className="text-lg font-semibold">Digital Download</h3>
              <p className="text-gray-600 mb-2">Get instant access to your personalized story</p>
              <p className="text-xl font-bold text-green-600">$10</p>
              <ul className="text-sm text-gray-600 mt-2">
                <li>• Instant download</li>
                <li>• High-quality PDF</li>
                <li>• Read on any device</li>
                <li>• Print at home option</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Print Option */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'print'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => handleOptionChange('print')}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="purchaseOption"
              checked={selectedOption === 'print'}
              onChange={() => handleOptionChange('print')}
              className="mt-1 mr-2"
            />
            <div>
              <h3 className="text-lg font-semibold">Printed Book</h3>
              <p className="text-gray-600 mb-2">Get a beautiful printed copy delivered to your door</p>
              <p className="text-xl font-bold text-green-600">$24.99</p>
              <ul className="text-sm text-gray-600 mt-2">
                <li>• Professional printing</li>
                <li>• High-quality paper</li>
                <li>• Durable binding</li>
                <li>• Ships worldwide</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Print Enhancement Options (only show if print is selected) */}
      {selectedOption === 'print' && enhancementServiceStatus?.available && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-purple-800">🎨 Print Quality Enhancement</h3>
              <p className="text-sm text-purple-600">AI-powered image enhancement for superior print quality</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={printEnhancement}
                onChange={(e) => handlePrintEnhancementChange(e.target.checked)}
                className="mr-2 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-purple-800">
                Enable (+${enhancementCost?.totalCost?.toFixed(2) || '0.00'})
              </span>
            </label>
          </div>

          {imageAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Image Analysis</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• {imageAnalysis.totalImages} images in book</li>
                  <li>• {imageAnalysis.imagesNeedingEnhancement} need enhancement</li>
                  <li>• Est. processing: {Math.ceil(imageAnalysis.estimatedEnhancementTime / 60)} min</li>
                </ul>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Enhancement Benefits</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 300+ DPI print resolution</li>
                  <li>• Enhanced color vibrancy</li>
                  <li>• Sharper details & clarity</li>
                  <li>• Professional print quality</li>
                </ul>
              </div>
            </div>
          )}

          {imageAnalysis?.imagesNeedingEnhancement > 0 && (
            <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded text-sm text-amber-800">
              <strong>Recommendation:</strong> {imageAnalysis.imagesNeedingEnhancement} of your images would benefit from enhancement for optimal print quality.
            </div>
          )}
        </div>
      )}

      {/* Shipping Options (only show if print is selected) */}
      {selectedOption === 'print' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Shipping Options</h3>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                name="shippingOption"
                id="standard"
                checked={shippingOption === 'standard'}
                onChange={() => handleShippingOptionChange('standard')}
                className="mr-2"
              />
              <label htmlFor="standard" className="flex justify-between w-full">
                <span>Standard Shipping (7-10 days)</span>
                <span className="font-semibold">Included</span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                name="shippingOption"
                id="expedited"
                checked={shippingOption === 'expedited'}
                onChange={() => handleShippingOptionChange('expedited')}
                className="mr-2"
              />
              <label htmlFor="expedited" className="flex justify-between w-full">
                <span>Expedited Shipping (2-3 days)</span>
                <span className="font-semibold">+$9.99</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      {selectedOption === 'print' && (printEnhancement || shippingOption === 'expedited') && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Price Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Printed Book</span>
              <span>$24.99</span>
            </div>
            {shippingOption === 'expedited' && (
              <div className="flex justify-between">
                <span>Expedited Shipping</span>
                <span>+$9.99</span>
              </div>
            )}
            {printEnhancement && enhancementCost && (
              <div className="flex justify-between">
                <span>Print Enhancement ({enhancementCost.imagesNeedingEnhancement} images)</span>
                <span>+${enhancementCost.totalCost.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg text-blue-800">
              <span>Total</span>
              <span>${calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handlePreviewPDF}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        >
          Preview PDF
        </button>

        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? 'Processing...' : `Buy ${selectedOption === 'digital' ? 'Digital Copy' : 'Printed Book'} - $${calculateTotalPrice().toFixed(2)}`}
        </button>
      </div>

      {/* Enhancement Service Status */}
      {selectedOption === 'print' && enhancementServiceStatus && !enhancementServiceStatus.available && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          <strong>Note:</strong> Print enhancement service is currently unavailable. Your book will be printed with standard quality.
        </div>
      )}

      {/* Shopify Configuration Status */}
      {shopifyConfig && !shopifyConfig.isConfigured && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          <strong>Configuration Required:</strong> Shopify integration is not properly configured. Please contact support to complete your purchase.
        </div>
      )}
    </div>
  );
};

export default BookPurchaseOptions;
