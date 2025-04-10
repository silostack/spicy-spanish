'use client';

import { useState } from 'react';

// Mock data for packages
const mockPackages = [
  {
    id: 1,
    name: 'Starter Package',
    hours: 5,
    priceUsd: 125,
    description: 'Perfect for beginners wanting to try out our Spanish lessons.',
  },
  {
    id: 2,
    name: 'Regular Package',
    hours: 10,
    priceUsd: 230,
    description: 'Our most popular package for consistent learning.',
    featured: true,
  },
  {
    id: 3,
    name: 'Intensive Package',
    hours: 20,
    priceUsd: 420,
    description: 'For serious learners who want to progress quickly.',
  },
];

// Mock data for transaction history
const mockTransactions = [
  {
    id: 1,
    date: '2025-03-10',
    packageName: 'Regular Package',
    hours: 10,
    amount: 230,
    paymentMethod: 'Credit Card',
    status: 'Completed',
  },
  {
    id: 2,
    date: '2025-02-05',
    packageName: 'Starter Package',
    hours: 5,
    amount: 125,
    paymentMethod: 'Crypto',
    status: 'Completed',
  },
];

export default function Payments() {
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const handlePackageSelect = (packageId: number) => {
    setSelectedPackage(packageId);
    setCheckoutModalOpen(true);
  };

  const handleCheckout = () => {
    // In a real app, this would process the payment through Stripe or a crypto wallet
    alert(`Payment processed for package #${selectedPackage} using ${paymentMethod === 'creditCard' ? 'Credit Card' : 'Crypto'}`);
    setCheckoutModalOpen(false);
    setSelectedPackage(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-spicy-dark">Payments</h1>
        <p className="text-gray-600">Purchase class packages and view your transaction history.</p>
      </div>

      {/* Package Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-spicy-dark">Class Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-xl shadow-md overflow-hidden ${pkg.featured ? 'border-2 border-spicy-red ring-2 ring-spicy-red ring-opacity-20' : ''}`}
            >
              {pkg.featured && (
                <div className="bg-spicy-red text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-spicy-dark">${pkg.priceUsd}</span>
                  <span className="text-gray-600"> for {pkg.hours} hours</span>
                </div>
                <p className="text-gray-600 mb-6">{pkg.description}</p>
                <button
                  className="w-full btn-primary"
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  Select Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-spicy-dark">Transaction History</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.packageName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button className="text-spicy-red hover:text-spicy-orange">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {mockTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No transaction history yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Checkout</h2>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">
                {mockPackages.find(p => p.id === selectedPackage)?.name}
              </h3>
              <p className="text-gray-600 mb-2">
                {mockPackages.find(p => p.id === selectedPackage)?.hours} hours
              </p>
              <p className="text-xl font-bold">
                ${mockPackages.find(p => p.id === selectedPackage)?.priceUsd}
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="flex space-x-4">
                <button
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    paymentMethod === 'creditCard'
                      ? 'border-spicy-red bg-spicy-light text-spicy-red'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('creditCard')}
                >
                  Credit Card
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    paymentMethod === 'crypto'
                      ? 'border-spicy-red bg-spicy-light text-spicy-red'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('crypto')}
                >
                  Crypto
                </button>
              </div>
            </div>
            
            {paymentMethod === 'creditCard' ? (
              <div className="mb-6 space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      id="expiration"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spicy-red"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <p className="mb-4">Connect your Solana wallet to proceed with payment.</p>
                <button className="btn-secondary">
                  Connect Wallet
                </button>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setCheckoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-opacity-90"
                onClick={handleCheckout}
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}