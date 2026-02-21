'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

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
  studentName: string;
  packageName: string;
  amount: number;
  hours: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  paymentMethod: string;
}

export default function PaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Student balance
  const [balance, setBalance] = useState<{ totalHoursPurchased: number; hoursUsed: number; availableHours: number } | null>(null);

  // Checkout modal state
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Fetch data after auth is ready
  useEffect(() => {
    if (authLoading) return;

    if (activeTab === 'packages') {
      fetchPackages();
    } else {
      fetchTransactions();
    }
  }, [activeTab, authLoading]);

  // Fetch student balance
  useEffect(() => {
    if (authLoading || !user || user.role !== 'student') return;

    api.get(`/payments/balance/${user.id}`)
      .then(res => setBalance(res.data))
      .catch(() => { /* Balance fetch is non-critical */ });
  }, [authLoading, user]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/packages');
      
      // Map backend format to frontend format
      const mappedPackages = response.data.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        hours: pkg.hours,
        price: pkg.priceUsd,
        isActive: pkg.isActive
      }));
      
      setPackages(mappedPackages);
      setLoading(false);
    } catch (error) {
      setError('Failed to load packages');
      setPackages([]);
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Use different endpoints for admin vs student
      const endpoint = user.role === 'admin'
        ? '/payments/transactions'
        : `/payments/transactions/student/${user.id}`;

      const response = await api.get(endpoint);

      // Map backend format (populated relations) to frontend format
      const mapped: Transaction[] = (response.data || []).map((t: any) => ({
        id: t.id,
        studentName: t.student
          ? `${t.student.firstName} ${t.student.lastName}`
          : 'Unknown',
        packageName: t.package?.name || 'Custom',
        amount: t.amountUsd,
        hours: t.hours,
        status: t.status,
        createdAt: t.createdAt,
        paymentMethod: t.paymentMethod,
      }));

      setTransactions(mapped);
      setLoading(false);
    } catch (error) {
      setError('Failed to load transactions');
      setTransactions([]);
      setLoading(false);
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
      alert('Failed to update package status');
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    // This function is now only used by students for checkout
    setSelectedPackage(pkg);
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedPackage || !user) return;

    try {
      setCheckoutLoading(true);
      setError(null);

      const response = await api.post('/payments/stripe/checkout', {
        packageId: selectedPackage.id,
        studentId: user.id,
        successUrl: `${window.location.origin}/dashboard/payments/success`,
        cancelUrl: `${window.location.origin}/dashboard/payments/cancel`,
      });

      const { sessionUrl } = response.data;

      if (sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleEditPackage = async () => {
    if (!editingPackage) return;
    
    try {
      await api.patch(`/payments/packages/${editingPackage.id}`, {
        name: editingPackage.name,
        description: editingPackage.description,
        hours: editingPackage.hours,
        priceUsd: editingPackage.price,
        isActive: editingPackage.isActive
      });
      
      alert('Package updated successfully!');
      setEditModalOpen(false);
      fetchPackages();
    } catch (error) {
      alert('Failed to update package. Changes saved locally for demo.');
      // Update locally for demo
      setPackages(prevPackages =>
        prevPackages.map(pkg =>
          pkg.id === editingPackage.id ? editingPackage : pkg
        )
      );
      setEditModalOpen(false);
    }
  };

  const handleCompletePayment = async (transactionId: string) => {
    try {
      await api.post(`/payments/transactions/${transactionId}/complete`);
      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      alert('Failed to mark payment as completed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Use a consistent date format to avoid hydration issues
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Show loading spinner while user data is being loaded
  if (authLoading || (loading && ((activeTab === 'packages' && packages.length === 0) || (activeTab === 'transactions' && transactions.length === 0)))) {
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
            {user?.role === 'admin' 
              ? 'Manage packages and view transactions' 
              : 'View available packages and your transaction history'}
          </p>
        </div>
        {user?.role === 'admin' && activeTab === 'packages' && (
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

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

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
          {user?.role === 'admin' ? (
            // Admin view - Enhanced Management Table
            <div>
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Admin Package Management:</strong> Edit package details and toggle their availability.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Package Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hours/Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price (USD)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {packages.length > 0 ? (
                        packages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {pkg.name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs">
                                {pkg.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {pkg.hours} hours
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                ${pkg.price}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => togglePackageStatus(pkg.id, pkg.isActive)}
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                                  pkg.isActive
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {pkg.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setEditingPackage(pkg);
                                  setEditModalOpen(true);
                                }}
                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Edit Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            No packages found. Click "Create Package" to add a new one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // Student view
            <div>
            {/* Hour Balance Card */}
            {balance && (
              <div className="mb-6 bg-gradient-to-r from-spicy-dark to-gray-800 rounded-xl p-6 text-white">
                <h3 className="text-sm font-medium text-gray-300 mb-1">Your Hour Balance</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{balance.availableHours}</span>
                  <span className="text-gray-300">hours remaining</span>
                </div>
                <div className="mt-3 flex gap-6 text-sm text-gray-400">
                  <span>{balance.totalHoursPurchased} purchased</span>
                  <span>{balance.hoursUsed} used</span>
                </div>
              </div>
            )}

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
                    {user?.role === 'admin' && (
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
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        {user?.role === 'admin' && (
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
                          {user?.role === 'admin' && transaction.status === 'pending' && (
                            <button
                              className="text-green-600 hover:text-green-800 font-medium mr-3"
                              onClick={() => handleCompletePayment(transaction.id)}
                            >
                              Mark Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Edit Package Modal (Admin) */}
      {editModalOpen && editingPackage && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Package</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={editingPackage.hours}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      hours: parseInt(e.target.value) || 0
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      price: parseFloat(e.target.value) || 0
                    })}
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingPackage.isActive}
                  onChange={(e) => setEditingPackage({
                    ...editingPackage,
                    isActive: e.target.checked
                  })}
                  className="h-4 w-4 text-spicy-red focus:ring-spicy-red border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Package is active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingPackage(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange"
                onClick={handleEditPackage}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Students) */}
      {checkoutModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Checkout</h2>

            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">{selectedPackage.name}</h3>
              <p className="text-gray-600 mb-2">{selectedPackage.hours} hours</p>
              <p className="text-xl font-bold">{formatCurrency(selectedPackage.price)}</p>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              You will be redirected to Stripe to complete your payment securely.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setCheckoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-spicy-red text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Redirecting...' : 'Pay with Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}