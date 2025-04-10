'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../utils/api';

interface Package {
  id: string;
  name: string;
  description: string;
  hours: number;
  price: number;
  isActive: boolean;
}

interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  packageId: string;
  packageName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  paymentMethod: string;
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState({ role: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Checkout modal state
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('creditCard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }

    if (activeTab === 'packages') {
      fetchPackages();
    } else {
      fetchTransactions();
    }
  }, [activeTab, currentPage]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/packages');
      setPackages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load packages');
      setLoading(false);
      
      // Fallback to mock data for demo purposes
      setPackages([
        {
          id: '1',
          name: 'Starter Package',
          description: 'Perfect for beginners wanting to try out our Spanish lessons.',
          hours: 5,
          price: 125,
          isActive: true
        },
        {
          id: '2',
          name: 'Regular Package',
          description: 'Our most popular package for consistent learning.',
          hours: 10,
          price: 230,
          isActive: true
        },
        {
          id: '3',
          name: 'Intensive Package',
          description: 'For serious learners who want to progress quickly.',
          hours: 20,
          price: 420,
          isActive: true
        }
      ]);
      setLoading(false);
      setError(null);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/transactions', {
        params: {
          page: currentPage,
          limit: 10,
        },
      });
      
      setTransactions(response.data.items);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
      setLoading(false);
      
      // Fallback to mock data for demo purposes
      setTransactions([
        {
          id: '1',
          studentId: '1',
          studentName: 'John Doe',
          packageId: '2',
          packageName: 'Regular Package',
          amount: 230,
          status: 'completed',
          createdAt: '2025-03-10T12:00:00Z',
          paymentMethod: 'Credit Card'
        },
        {
          id: '2',
          studentId: '1',
          studentName: 'John Doe',
          packageId: '1',
          packageName: 'Starter Package',
          amount: 125,
          status: 'completed',
          createdAt: '2025-02-05T15:30:00Z',
          paymentMethod: 'Crypto'
        }
      ]);
      setTotalPages(1);
      setLoading(false);
      setError(null);
    }
  };

  const togglePackageStatus = async (packageId: string, isActive: boolean) => {
    try {
      await api.patch(`/payments/packages/${packageId}`, {
        isActive: !isActive
      });
      
      // Update the packages list
      setPackages(prevPackages => 
        prevPackages.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, isActive: !isActive } 
            : pkg
        )
      );
    } catch (error) {
      console.error('Error toggling package status:', error);
      alert('Failed to update package status');
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setCheckoutModalOpen(true);
  };

  const handleCheckout = () => {
    // In a real app, this would process the payment
    alert(`Payment processed for ${selectedPackage?.name} using ${paymentMethod === 'creditCard' ? 'Credit Card' : 'Crypto'}`);
    setCheckoutModalOpen(false);
    setSelectedPackage(null);
    
    // Refresh the transaction list after successful payment
    if (activeTab !== 'transactions') {
      setActiveTab('transactions');
    } else {
      fetchTransactions();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && ((activeTab === 'packages' && packages.length === 0) || (activeTab === 'transactions' && transactions.length === 0))) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-spicy-dark">Payments</h1>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'Manage packages and view transactions' 
              : 'View available packages and your transaction history'}
          </p>
        </div>
        {user.role === 'admin' && activeTab === 'packages' && (
          <Link
            href="/dashboard/payments/new-package"
            className="btn-primary bg-spicy-red hover:bg-spicy-orange text-white font-bold py-2 px-4 rounded-lg flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Package
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
              activeTab === 'packages'
                ? 'border-spicy-red text-spicy-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-spicy-red text-spicy-red'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>

      {/* Packages */}
      {activeTab === 'packages' && (
        <div>
          {user.role === 'admin' ? (
            // Admin view - Table
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages.length > 0 ? (
                      packages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pkg.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {pkg.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {pkg.hours} hours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(pkg.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              pkg.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link href={`/dashboard/payments/packages/${pkg.id}/edit`} className="text-blue-600 hover:text-blue-900">
                                Edit
                              </Link>
                              <button
                                onClick={() => togglePackageStatus(pkg.id, pkg.isActive)}
                                className={pkg.isActive ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                              >
                                {pkg.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No packages found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Student view - Cards
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {packages
                .filter(pkg => pkg.isActive)
                .map((pkg, index) => (
                  <div 
                    key={pkg.id} 
                    className={`bg-white rounded-xl shadow-md overflow-hidden ${index === 1 ? 'border-2 border-spicy-red ring-2 ring-spicy-red ring-opacity-20' : ''}`}
                  >
                    {index === 1 && (
                      <div className="bg-spicy-red text-white text-center py-1 text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-spicy-dark">{formatCurrency(pkg.price)}</span>
                        <span className="text-gray-600"> for {pkg.hours} hours</span>
                      </div>
                      <p className="text-gray-600 mb-6">{pkg.description}</p>
                      <button
                        className="w-full bg-spicy-red hover:bg-spicy-orange text-white py-2 px-4 rounded-lg transition-colors"
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        Select Package
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {user.role === 'admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        {user.role === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.studentName}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.packageName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button className="text-spicy-red hover:text-spicy-orange">
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Checkout</h2>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">{selectedPackage.name}</h3>
              <p className="text-gray-600 mb-2">{selectedPackage.hours} hours</p>
              <p className="text-xl font-bold">{formatCurrency(selectedPackage.price)}</p>
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
                <p className="mb-4">Connect your wallet to proceed with payment.</p>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
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