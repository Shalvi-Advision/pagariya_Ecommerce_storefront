import React, { useState, useEffect } from 'react';
import groceryApiService from '../services/groceryApi';

const TestCategoryPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test 1: Get all categories
    try {
      const categoriesResponse = await groceryApiService.getCategories();
      results.push({
        test: 'Get Categories',
        success: categoriesResponse.success,
        data: categoriesResponse.data?.length || 0,
        message: categoriesResponse.message
      });
    } catch (error) {
      results.push({
        test: 'Get Categories',
        success: false,
        error: error.message
      });
    }

    // Test 2: Get Dals category
    try {
      const dalsResponse = await groceryApiService.getProductsByCategory('dals');
      results.push({
        test: 'Get Dals Category',
        success: dalsResponse.success,
        data: dalsResponse.data?.length || 0,
        message: dalsResponse.message
      });
    } catch (error) {
      results.push({
        test: 'Get Dals Category',
        success: false,
        error: error.message
      });
    }

    // Test 3: Get all products
    try {
      const allProductsResponse = await groceryApiService.getAllProducts();
      results.push({
        test: 'Get All Products',
        success: allProductsResponse.success,
        data: allProductsResponse.data?.length || 0,
        message: allProductsResponse.message
      });
    } catch (error) {
      results.push({
        test: 'Get All Products',
        success: false,
        error: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Category API Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Tests'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Running tests...</p>
            </div>
          )}

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Data:</strong> {result.data}</p>
                  <p><strong>Message:</strong> {result.message}</p>
                  {result.error && (
                    <p><strong>Error:</strong> {result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {testResults.length > 0 && testResults[0].success && testResults[0].data > 0 && (
              <>
                <a href="/category/dals" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Dals</h3>
                  <p className="text-sm text-gray-600">48 products</p>
                </a>
                <a href="/category/pulses" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Pulses</h3>
                  <p className="text-sm text-gray-600">67 products</p>
                </a>
                <a href="/category/dry-fruits" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Dry Fruits</h3>
                  <p className="text-sm text-gray-600">148 products</p>
                </a>
                <a href="/category/cooking-oil" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Cooking Oil</h3>
                  <p className="text-sm text-gray-600">98 products</p>
                </a>
                <a href="/category/ghee-vanaspati" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Ghee & Vanaspati</h3>
                  <p className="text-sm text-gray-600">41 products</p>
                </a>
                <a href="/category/flours-grains" className="p-4 border rounded-lg hover:bg-gray-50">
                  <h3 className="font-medium">Flours & Grains</h3>
                  <p className="text-sm text-gray-600">84 products</p>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCategoryPage;


