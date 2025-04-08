import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard as CreditCardIcon, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader, 
  Calendar, 
  Clock, 
  Database, 
  Server, 
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { 
  BillingPlan, 
  PaymentMethod, 
  Invoice, 
  UsageStats, 
  BillingData,
  availablePlans,
  getBillingData,
  changeBillingPlan,
  addPaymentMethod,
  downloadInvoice
} from '../../lib/billing';

export default function BillingSettings() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    name: '',
    isDefault: false
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getBillingData();
      if (!data) {
        throw new Error('Failed to load billing data');
      }
      
      setBillingData(data);
      setSelectedPlan(data.currentPlan.id);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setError('Failed to load billing data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan || !billingData) return;
    
    try {
      setChangingPlan(true);
      const success = await changeBillingPlan(selectedPlan);
      
      if (success) {
        // Update local state
        const newPlan = availablePlans.find(p => p.id === selectedPlan);
        if (newPlan) {
          setBillingData({
            ...billingData,
            currentPlan: newPlan
          });
        }
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      showToast('Failed to change plan', 'error');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvc || !newPaymentMethod.name) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    try {
      setAddingPaymentMethod(true);
      const success = await addPaymentMethod(newPaymentMethod);
      
      if (success) {
        // Reset form and hide it
        setNewPaymentMethod({
          cardNumber: '',
          expiryDate: '',
          cvc: '',
          name: '',
          isDefault: false
        });
        setShowAddPaymentMethod(false);
        
        // Reload billing data to get updated payment methods
        await loadBillingData();
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      showToast('Failed to add payment method', 'error');
    } finally {
      setAddingPaymentMethod(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, format: 'pdf' | 'csv') => {
    try {
      await downloadInvoice(invoiceId, format);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('Failed to download invoice', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error Loading Billing Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={loadBillingData}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!billingData) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No Billing Data Available</h3>
          <p className="text-gray-500 mb-4">We couldn't find any billing information for your account.</p>
          <Button
            variant="primary"
            onClick={loadBillingData}
          >
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
        <div className="bg-accent p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-secondary mr-2" />
                <h4 className="text-xl font-bold text-text">{billingData.currentPlan.name} Plan</h4>
              </div>
              <p className="text-gray-600 mt-1">
                {billingData.currentPlan.price === 0 
                  ? 'Free' 
                  : `$${billingData.currentPlan.price}/${billingData.currentPlan.billingCycle}`}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="primary"
                onClick={() => document.getElementById('plan-selection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Change Plan
              </Button>
            </div>
          </div>
        </div>
        
        <h4 className="font-medium text-text mb-3">Plan Features</h4>
        <ul className="space-y-2 mb-6">
          {billingData.currentPlan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <h4 className="font-medium text-text mb-3">Usage</h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-secondary mr-2" />
                <span className="text-sm font-medium">Quiz Submissions</span>
              </div>
              <span className="text-sm text-gray-500">
                {billingData.usageStats.quizSubmissions.current} / {billingData.usageStats.quizSubmissions.limit}
              </span>
            </div>
            <Progress 
              value={billingData.usageStats.quizSubmissions.percentage} 
              max={100}
              size="sm"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-secondary mr-2" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm text-gray-500">
                {billingData.usageStats.storage.current} GB / {billingData.usageStats.storage.limit} GB
              </span>
            </div>
            <Progress 
              value={billingData.usageStats.storage.percentage} 
              max={100}
              size="sm"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <Server className="h-4 w-4 text-secondary mr-2" />
                <span className="text-sm font-medium">API Calls</span>
              </div>
              <span className="text-sm text-gray-500">
                {billingData.usageStats.apiCalls.current} / {billingData.usageStats.apiCalls.limit}
              </span>
            </div>
            <Progress 
              value={billingData.usageStats.apiCalls.percentage} 
              max={100}
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus />}
            onClick={() => setShowAddPaymentMethod(true)}
          >
            Add Payment Method
          </Button>
        </div>
        
        {billingData.paymentMethods.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No payment methods added yet</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddPaymentMethod(true)}
            >
              Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {billingData.paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  {method.type === 'credit_card' ? (
                    <CreditCardIcon className="h-5 w-5 text-gray-500 mr-3" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                  )}
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500">
                      {method.type === 'credit_card' ? `•••• ${method.last4}` : method.type}
                      {method.expiryDate && ` • Expires ${method.expiryDate}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {method.isDefault && (
                    <span className="mr-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Default
                    </span>
                  )}
                  <button
                    className="text-red-500 hover:text-red-700"
                    title="Remove payment method"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Payment Method Form */}
        {showAddPaymentMethod && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Add Payment Method</h4>
              <button
                className="text-gray-500 hover:text-text"
                onClick={() => setShowAddPaymentMethod(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddPaymentMethod}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.cardNumber}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.expiryDate}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.cvc}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cvc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.name}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="default-payment"
                    checked={newPaymentMethod.isDefault}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked })}
                    className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                  />
                  <label htmlFor="default-payment" className="ml-2 block text-sm text-text">
                    Set as default payment method
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPaymentMethod(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={addingPaymentMethod}
                  >
                    Add Payment Method
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Billing History */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Billing History</h3>
        
        {billingData.billingHistory.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No billing history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-gray-200">
                {billingData.billingHistory.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id, 'pdf')}
                        className="text-secondary hover:text-primary mr-3"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Plan Selection */}
      <Card id="plan-selection">
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {availablePlans.map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-lg p-4 ${
                selectedPlan === plan.id 
                  ? 'border-secondary bg-accent' 
                  : 'border-gray-200 hover:border-accent'
              } cursor-pointer transition-colors`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{plan.name}</h4>
                  <p className="text-2xl font-bold mt-1">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.billingCycle}</span>
                  </p>
                </div>
                {selectedPlan === plan.id && (
                  <div className="bg-accent rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-secondary" />
                  </div>
                )}
              </div>
              
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {billingData.currentPlan.id === plan.id ? (
                <div className="text-center py-2 bg-accent text-primary rounded-md text-sm font-medium">
                  Current Plan
                </div>
              ) : (
                <Button
                  variant={selectedPlan === plan.id ? "primary" : "outline"}
                  className="w-full"
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  Select
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {selectedPlan && selectedPlan !== billingData.currentPlan.id && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleChangePlan}
              loading={changingPlan}
            >
              {changingPlan ? 'Changing Plan...' : 'Change Plan'}
            </Button>
          </div>
        )}
      </Card>

      {/* Usage Reports */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Usage Reports</h3>
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowRight />}
            onClick={() => window.location.href = '/admin/billing-report'}
          >
            View Detailed Report
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-secondary mr-2" />
              <h4 className="font-medium">Recent Activity</h4>
            </div>
            <p className="text-sm text-gray-600">
              View your recent quiz submissions and access logs
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Database className="h-5 w-5 text-secondary mr-2" />
              <h4 className="font-medium">Storage Usage</h4>
            </div>
            <p className="text-sm text-gray-600">
              {billingData.usageStats.storage.current} GB of {billingData.usageStats.storage.limit} GB used
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Server className="h-5 w-5 text-secondary mr-2" />
              <h4 className="font-medium">API Usage</h4>
            </div>
            <p className="text-sm text-gray-600">
              {billingData.usageStats.apiCalls.current} of {billingData.usageStats.apiCalls.limit} API calls used
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}