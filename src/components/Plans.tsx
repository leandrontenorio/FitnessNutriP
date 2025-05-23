import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, CheckSquare, Check, ArrowRight, Clock, Zap, Gift } from 'lucide-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

// Initialize Mercado Pago SDK
const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
if (!mpPublicKey) {
  throw new Error('Missing Mercado Pago public key');
}
initMercadoPago(mpPublicKey);

function Plans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const handleFreePlan = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado para continuar');
        return;
      }

      // Get user registration data
      const { data: registration } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!registration) {
        toast.error('Complete seu cadastro primeiro');
        navigate('/');
        return;
      }

      // Calculate daily calories based on user data
      const bmr = registration.gender === 'male'
        ? 88.362 + (13.397 * registration.weight) + (4.799 * registration.height) - (5.677 * registration.age)
        : 447.593 + (9.247 * registration.weight) + (3.098 * registration.height) - (4.330 * registration.age);

      let activityMultiplier = 1.2; // Sedentary
      if (registration.activity_level?.includes('Levemente ativo')) {
        activityMultiplier = 1.375;
      } else if (registration.activity_level?.includes('Moderadamente ativo')) {
        activityMultiplier = 1.55;
      } else if (registration.activity_level?.includes('Altamente ativo')) {
        activityMultiplier = 1.725;
      } else if (registration.activity_level?.includes('Extremamente ativo')) {
        activityMultiplier = 1.9;
      }

      const tdee = Math.round(bmr * activityMultiplier);
      let dailyCalories = tdee;

      // Adjust calories based on goal
      switch (registration.goal) {
        case 'emagrecer':
          dailyCalories = tdee - 500;
          break;
        case 'massa':
          dailyCalories = tdee + 500;
          break;
        case 'definicao':
          dailyCalories = tdee - 300;
          break;
        case 'definicao_massa':
          dailyCalories = tdee + 200;
          break;
      }

      // Create nutritional plan
      const { data: plan, error: planError } = await supabase
        .from('nutritional_plans')
        .insert([{
          user_id: user.id,
          daily_calories: dailyCalories,
          protein_percentage: 30,
          carbs_percentage: 40,
          fat_percentage: 30,
          objective: registration.goal,
          start_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Create plan objectives
      const { error: objectivesError } = await supabase
        .from('plan_objectives')
        .insert([{
          plan_id: plan.id,
          initial_weight: registration.weight,
          activity_level: registration.activity_level,
          weekly_goal: registration.goal === 'emagrecer' ? -0.5 : 
                      registration.goal === 'massa' ? 0.5 : 0
        }]);

      if (objectivesError) throw objectivesError;

      // Update profile to indicate free plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_paid_plan: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Plano básico gerado com sucesso!');
      navigate('/plan');
    } catch (error) {
      console.error('Error creating free plan:', error);
      toast.error('Erro ao gerar plano básico');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado para fazer a compra');
        return;
      }

      // Create payment preference
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN}`,
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
            email: user.email
          },
          back_urls: {
            success: "https://wondrous-yeot-7f10c4.netlify.app/plan",
            failure: "https://wondrous-yeot-7f10c4.netlify.app/payment/failure",
            pending: "https://wondrous-yeot-7f10c4.netlify.app/payment/pending"
          },
          auto_return: 'approved',
          external_reference: user.id,
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
      setPreferenceId(data.id);
    } catch (error) {
      console.error('Error initiating purchase:', error);
      toast.error('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#6a1b9a] mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600">
            Transforme sua vida com um plano nutricional personalizado
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Plano Básico</h2>
                <span className="px-4 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Grátis
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#28a745] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Acesso a receitas básicas</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#28a745] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Calculadora de calorias</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#28a745] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Dicas nutricionais semanais</span>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50">
              <button
                onClick={handleFreePlan}
                disabled={loading}
                className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Começar Grátis'}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
            <div className="absolute top-4 right-4">
              <span className="px-4 py-1 bg-[#6a1b9a] text-white rounded-full text-sm font-medium">
                Recomendado
              </span>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Plano Premium</h2>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#6a1b9a]">R$9,90</span>
                  <span className="text-gray-500 text-sm">/único</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Star className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Plano nutricional personalizado</span>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Planejamento semanal de refeições</span>
                </div>
                <div className="flex items-start">
                  <CheckSquare className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Lista de compras personalizada</span>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Suporte nutricional por 30 dias</span>
                </div>
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Treinos personalizados</span>
                </div>
                <div className="flex items-start">
                  <Gift className="h-5 w-5 text-[#6a1b9a] mt-0.5 mr-3 flex-shrink-0" />
                  <span>Bônus exclusivos</span>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50">
              {preferenceId ? (
                <div className="w-full">
                  <Wallet 
                    initialization={{ preferenceId }}
                    customization={{
                      texts: { valueProp: 'smart_option' },
                      visual: {
                        buttonBackground: '#28a745',
                        borderRadius: '8px'
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-[#28a745] text-white rounded-lg hover:bg-[#218838] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Processando...'
                  ) : (
                    <>
                      <span>Começar Agora</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
              <p className="text-center text-sm text-gray-500 mt-4">
                Pagamento único - Sem assinatura
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Plans;