'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface Package {
  id: string;
  name: string;
  description: string;
  hours: number;
  priceUsd: number;
  isActive: boolean;
}

interface Transaction {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  package?: Package;
  amountUsd: number;
  hours: number;
  paymentMethod: 'credit_card' | 'crypto' | 'zelle' | 'paypal' | 'manual';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentId?: string;
  cryptoTransactionId?: string;
  notes?: string;
  invoiceUrl?: string;
  createdAt: string;
}

interface StripeCheckoutResponse {
  sessionId: string;
  sessionUrl: string;
  transactionId: string;
}

interface CryptoCheckoutResponse {
  transactionId: string;
  amountUsd: number;
  walletAddress: string;
  successUrl: string;
}

interface PaymentsContextType {
  packages: Package[];
  transactions: Transaction[];
  selectedPackage: Package | null;
  isLoading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  selectPackage: (pkg: Package) => void;
  initiateStripeCheckout: () => Promise<StripeCheckoutResponse | null>;
  initiateCryptoPayment: () => Promise<CryptoCheckoutResponse | null>;
  completeManualPayment: (transactionId: string, cryptoTxId?: string) => Promise<void>;
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export const PaymentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { token, user } = useAuth();
  const { addNotification } = useApp();

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/payments/packages/active');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to fetch packages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      
      if (user.role === 'student') {
        endpoint = `/payments/transactions/student/${user.id}`;
      } else if (user.role === 'admin') {
        endpoint = '/payments/transactions';
      }
      
      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const initiateStripeCheckout = async (): Promise<StripeCheckoutResponse | null> => {
    if (!token || !user || !selectedPackage) {
      setError('Missing required payment information');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/payments/stripe/checkout', {
        packageId: selectedPackage.id,
        studentId: user.id,
        successUrl: `${window.location.origin}/dashboard/payments/success`,
        cancelUrl: `${window.location.origin}/dashboard/payments/cancel`,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error initiating Stripe checkout:', error);
      setError('Failed to initiate payment');
      
      addNotification({
        message: 'Failed to initiate payment',
        type: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCryptoPayment = async (): Promise<CryptoCheckoutResponse | null> => {
    if (!token || !user || !selectedPackage) {
      setError('Missing required payment information');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/payments/crypto/checkout', {
        packageId: selectedPackage.id,
        studentId: user.id,
        successUrl: `${window.location.origin}/dashboard/payments/crypto-success`,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error initiating crypto payment:', error);
      setError('Failed to initiate crypto payment');
      
      addNotification({
        message: 'Failed to initiate crypto payment',
        type: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const completeManualPayment = async (transactionId: string, cryptoTxId?: string) => {
    if (!token || !user?.role === 'admin') {
      setError('Unauthorized operation');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post(`/payments/transactions/${transactionId}/complete`, 
        { cryptoTransactionId: cryptoTxId }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Refresh transactions
      await fetchTransactions();
      
      addNotification({
        message: 'Payment marked as completed successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error completing manual payment:', error);
      setError('Failed to complete payment');
      
      addNotification({
        message: 'Failed to mark payment as completed',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data when component mounts
  useEffect(() => {
    fetchPackages();
    
    if (token && user) {
      fetchTransactions();
    }
  }, [token, user]);

  return (
    <PaymentsContext.Provider
      value={{
        packages,
        transactions,
        selectedPackage,
        isLoading,
        error,
        fetchPackages,
        fetchTransactions,
        selectPackage,
        initiateStripeCheckout,
        initiateCryptoPayment,
        completeManualPayment,
      }}
    >
      {children}
    </PaymentsContext.Provider>
  );
};

export const usePayments = (): PaymentsContextType => {
  const context = useContext(PaymentsContext);
  
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  
  return context;
};