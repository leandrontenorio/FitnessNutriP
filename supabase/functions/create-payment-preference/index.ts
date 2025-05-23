import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, origin } = await req.json();

    if (!userId || !email || !origin) {
      throw new Error('Missing required parameters');
    }

    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('Missing Mercado Pago access token');
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
          email: email
        },
        back_urls: {
          success: `${origin}/payment/success`,
          failure: `${origin}/payment/failure`,
          pending: `${origin}/payment/pending`
        },
        auto_return: 'approved',
        external_reference: userId,
        notification_url: `${origin}/api/webhook/mercadopago`,
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

    return new Response(
      JSON.stringify({
        id: data.id,
        init_point: data.init_point
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});