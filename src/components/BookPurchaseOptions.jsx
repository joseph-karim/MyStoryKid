import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCheckoutUrl } from '../services/shopifyService';
import { generateBookPDF } from '../services/digitalDownloadService';
import useAuthStore from '../store/useAuthStore';

/**
 * Component for displaying book purchase options (digital download or print)
 */
const BookPurchaseOptions = ({ book }) => {
  const [selectedOption, setSelectedOption] = useState('digital');
  const [shippingOption, setShippingOption] = useState('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Handle option selection
  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  // Handle shipping option selection
  const handleShippingOptionChange = (option) => {
    setShippingOption(option);
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
        // For digital option, redirect to Shopify checkout for digital product
        const checkoutUrl = getCheckoutUrl(book, 'digital');
        window.location.href = checkoutUrl;
      } else {
        // For print option, redirect to Shopify checkout for print product
        const variant = shippingOption === 'expedited' ? 'print-expedited' : 'print-standard';
        const checkoutUrl = getCheckoutUrl(book, variant);
        window.location.href = checkoutUrl;
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
          {isLoading ? 'Processing...' : `Buy ${selectedOption === 'digital' ? 'Digital Copy' : 'Printed Book'}`}
        </button>
      </div>
    </div>
  );
};

export default BookPurchaseOptions;
