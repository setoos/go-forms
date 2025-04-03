import { supabase } from './supabase';
import { showToast } from './toast';

// Submission type
export interface Submission {
  id: string;
  quizId: string;
  quizName: string;
  submissionDate: string;
  user: {
    name: string;
    email: string;
  };
  ipAddress: string;
  sessionDuration: number; // seconds
  completionStatus: 'completed' | 'incomplete';
  cost: number;
}

// Access log type
export interface AccessLog {
  id: string;
  quizId: string;
  quizName: string;
  user: {
    name: string;
    email: string;
  };
  timestamp: string;
  ipAddress: string;
  action: string;
  status: 'success' | 'failed';
  details: string;
}

// Billing plan types
export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    quizSubmissions: number;
    storage: number; // GB
    apiCalls: number;
  };
}

// Payment method type
export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  last4?: string;
  expiryDate?: string;
  name: string;
  isDefault: boolean;
}

// Invoice type
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  pdfUrl?: string;
}

// Usage stats type
export interface UsageStats {
  quizSubmissions: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    current: number; // GB
    limit: number; // GB
    percentage: number;
  };
  apiCalls: {
    current: number;
    limit: number;
    percentage: number;
  };
}

// Billing data type
export interface BillingData {
  currentPlan: BillingPlan;
  paymentMethods: PaymentMethod[];
  billingHistory: Invoice[];
  usageStats: UsageStats;
}

// Available plans
export const availablePlans: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: [
      'Up to 3 quizzes',
      'Basic analytics',
      'Standard templates',
      'Email support'
    ],
    limits: {
      quizSubmissions: 100,
      storage: 1,
      apiCalls: 1000
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    billingCycle: 'monthly',
    features: [
      'Up to 10 quizzes',
      'Standard analytics',
      'All templates',
      'Email support',
      'Custom branding'
    ],
    limits: {
      quizSubmissions: 250,
      storage: 3,
      apiCalls: 5000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited quizzes',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support'
    ],
    limits: {
      quizSubmissions: 500,
      storage: 5,
      apiCalls: 10000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited quizzes',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees'
    ],
    limits: {
      quizSubmissions: 2000,
      storage: 20,
      apiCalls: 50000
    }
  }
];

/**
 * Get the user's billing data
 */
export async function getBillingData(): Promise<BillingData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to fetch the user's billing data
    // For this demo, we'll return mock data
    
    // Get the user's current plan
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Changed from single() to maybeSingle()
      
    if (planError && planError.code !== 'PGRST116') {
      throw planError;
    }
    
    // If no plan found, default to free
    const currentPlan = userPlan 
      ? availablePlans.find(p => p.id === userPlan.plan_id) || availablePlans[0]
      : availablePlans[0];
    
    // Get payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id);
      
    if (paymentError) {
      throw paymentError;
    }
    
    // Get billing history
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
      
    if (invoiceError) {
      throw invoiceError;
    }
    
    // Get usage stats
    const { data: usageData, error: usageError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Changed from single() to maybeSingle()
      
    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }
    
    // Format the data
    const formattedPaymentMethods: PaymentMethod[] = paymentMethods?.map(pm => ({
      id: pm.id,
      type: pm.type,
      last4: pm.last4,
      expiryDate: pm.expiry_date,
      name: pm.name,
      isDefault: pm.is_default
    })) || [];
    
    const formattedInvoices: Invoice[] = invoices?.map(inv => ({
      id: inv.id,
      date: inv.date,
      amount: inv.amount,
      status: inv.status,
      description: inv.description,
      items: inv.items || [],
      pdfUrl: inv.pdf_url
    })) || [];
    
    // Calculate usage percentages
    const usageStats: UsageStats = {
      quizSubmissions: {
        current: usageData?.quiz_submissions_count || 0,
        limit: currentPlan.limits.quizSubmissions,
        percentage: usageData 
          ? Math.min(100, (usageData.quiz_submissions_count / currentPlan.limits.quizSubmissions) * 100)
          : 0
      },
      storage: {
        current: usageData?.storage_used || 0,
        limit: currentPlan.limits.storage,
        percentage: usageData 
          ? Math.min(100, (usageData.storage_used / currentPlan.limits.storage) * 100)
          : 0
      },
      apiCalls: {
        current: usageData?.api_calls_count || 0,
        limit: currentPlan.limits.apiCalls,
        percentage: usageData 
          ? Math.min(100, (usageData.api_calls_count / currentPlan.limits.apiCalls) * 100)
          : 0
      }
    };
    
    // Return the billing data
    return {
      currentPlan,
      paymentMethods: formattedPaymentMethods,
      billingHistory: formattedInvoices,
      usageStats
    };
  } catch (error) {
    console.error('Error getting billing data:', error);
    showToast('Failed to load billing data', 'error');
    return null;
  }
}

/**
 * Get quiz submissions for billing
 */
export async function getQuizSubmissions(dateRange: { start: Date, end: Date }): Promise<Submission[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to fetch the user's quiz submissions
    // For this demo, we'll return mock data
    
    const { data: submissions, error } = await supabase
      .from('quiz_submissions')
      .select(`
        id,
        quiz_id,
        quiz_name,
        submission_date,
        user_name,
        user_email,
        ip_address,
        session_duration,
        completion_status,
        cost
      `)
      .eq('user_id', user.id)
      .gte('submission_date', dateRange.start.toISOString())
      .lte('submission_date', dateRange.end.toISOString())
      .order('submission_date', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Format the data
    return submissions?.map(sub => ({
      id: sub.id,
      quizId: sub.quiz_id,
      quizName: sub.quiz_name,
      submissionDate: sub.submission_date,
      user: {
        name: sub.user_name,
        email: sub.user_email
      },
      ipAddress: sub.ip_address,
      sessionDuration: sub.session_duration,
      completionStatus: sub.completion_status,
      cost: sub.cost
    })) || [];
  } catch (error) {
    console.error('Error getting quiz submissions:', error);
    showToast('Failed to load quiz submissions', 'error');
    return [];
  }
}

/**
 * Get access logs for billing
 */
export async function getAccessLogs(dateRange: { start: Date, end: Date }): Promise<AccessLog[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to fetch the user's access logs
    // For this demo, we'll return mock data
    
    const { data: logs, error } = await supabase
      .from('access_logs')
      .select(`
        id,
        quiz_id,
        quiz_name,
        user_name,
        user_email,
        timestamp,
        ip_address,
        action,
        status,
        details
      `)
      .eq('user_id', user.id)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())
      .order('timestamp', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Format the data
    return logs?.map(log => ({
      id: log.id,
      quizId: log.quiz_id,
      quizName: log.quiz_name,
      user: {
        name: log.user_name,
        email: log.user_email
      },
      timestamp: log.timestamp,
      ipAddress: log.ip_address,
      action: log.action,
      status: log.status,
      details: log.details
    })) || [];
  } catch (error) {
    console.error('Error getting access logs:', error);
    showToast('Failed to load access logs', 'error');
    return [];
  }
}

/**
 * Change the user's billing plan
 */
export async function changeBillingPlan(planId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to change the user's plan
    // For this demo, we'll simulate the API call
    
    const { data, error } = await supabase
      .from('user_plans')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (error) {
      throw error;
    }
    
    showToast(`Plan changed to ${availablePlans.find(p => p.id === planId)?.name}`, 'success');
    return true;
  } catch (error) {
    console.error('Error changing billing plan:', error);
    showToast('Failed to change billing plan', 'error');
    return false;
  }
}

/**
 * Add a payment method
 */
export async function addPaymentMethod(paymentDetails: {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  name: string;
  isDefault: boolean;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to add a payment method
    // For this demo, we'll simulate the API call
    
    // Extract last 4 digits of card number
    const last4 = paymentDetails.cardNumber.slice(-4);
    
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        type: 'credit_card',
        last4,
        expiry_date: paymentDetails.expiryDate,
        name: paymentDetails.name,
        is_default: paymentDetails.isDefault
      });
      
    if (error) {
      throw error;
    }
    
    // If this is the default payment method, update all other payment methods
    if (paymentDetails.isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('last4', last4);
    }
    
    showToast('Payment method added successfully', 'success');
    return true;
  } catch (error) {
    console.error('Error adding payment method:', error);
    showToast('Failed to add payment method', 'error');
    return false;
  }
}

/**
 * Download invoice
 */
export async function downloadInvoice(invoiceId: string, format: 'pdf' | 'csv'): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would be an API call to download the invoice
    // For this demo, we'll simulate the API call
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      throw error;
    }
    
    if (format === 'pdf') {
      // In a real app, this would download the PDF
      // For this demo, we'll just show a toast
      showToast('Invoice downloaded as PDF', 'success');
    } else {
      // In a real app, this would download the CSV
      // For this demo, we'll just show a toast
      showToast('Invoice downloaded as CSV', 'success');
    }
    
    return true;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    showToast('Failed to download invoice', 'error');
    return false;
  }
}

/**
 * Calculate the cost of a quiz submission
 */
export function calculateSubmissionCost(completionStatus: 'completed' | 'incomplete'): number {
  // In a real app, this would be a more complex calculation
  // For this demo, we'll use a simple calculation
  return completionStatus === 'completed' ? 0.50 : 0.25;
}