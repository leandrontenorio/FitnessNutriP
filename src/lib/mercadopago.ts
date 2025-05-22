import { initMercadoPago } from '@mercadopago/sdk-react';
import { supabase } from './supabase';

// Initialize Mercado Pago SDK
const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
const mpAccessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;

if (!mpPublicKey || !mpAccessToken) {
  throw new Error('Missing Mercado Pago credentials');
}

initMercadoPago(mpPublicKey);

export interface PaymentPreference {
  id: string;
  init_point: string;
}

export const createPaymentPreference = async (userId: string): Promise<PaymentPreference> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      throw new Error('User email not found');
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: 'premium-plan',
          title: 'Plano Premium Fitness Nutri',
          description: 'Plano nutricional personalizado com suporte por 30 dias',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 9.90
        }],
        payer: {
          email: session.user.email
        },
        back_urls: {
          "success": "https://wondrous-yeot-7f10c4.netlify.app/plan",
          "failure": "https://wondrous-yeot-7f10c4.netlify.app/payment/failure",
          "pending": "https://wondrous-yeot-7f10c4.netlify.app/payment/pending"
        },
        auto_return: 'approved',
        external_reference: userId,
        notification_url: `${window.location.origin}/api/webhook/mercadopago`,
        statement_descriptor: 'FITNESSNUTRI',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment preference');
    }

    const data = await response.json();
    return {
      id: data.id,
      init_point: data.init_point
    };
  } catch (error) {
    console.error('Error creating payment preference:', error);
    throw error;
  }
};

export const processPayment = async (
  userId: string,
  paymentId: string,
  status: string
): Promise<void> => {
  try {
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          external_id: paymentId,
          amount: 9.90,
          currency: 'BRL',
          status: status,
          payment_method: 'mercadopago'
        }
      ])
      .select()
      .single();

    if (paymentError) throw paymentError;

    if (status === 'approved') {
      // Create subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: userId,
            plan_type: 'premium',
            status: 'active',
            payment_id: payment.id
          }
        ]);

      if (subscriptionError) throw subscriptionError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_paid_plan: true })
        .eq('id', userId);

      if (profileError) throw profileError;
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};