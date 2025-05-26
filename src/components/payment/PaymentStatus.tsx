import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { processPayment } from '../../lib/mercadopago';
import toast from 'react-hot-toast';

function PaymentStatus() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 10;
  const retryDelay = 3000;

  // Ref para controlar se polling está ativo e para evitar race condition
  const pollingActiveRef = useRef(true);

  // Função para checar status do plano
  const checkPlanStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_paid_plan')
        .eq('id', user.id)
        .single();

      const { data: plan } = await supabase
        .from('nutritional_plans')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return profile?.has_paid_plan && !!plan?.id;
    } catch (err) {
      console.error('Error checking plan status:', err);
      return false;
    }
  };

  useEffect(() => {
    let pollTimeout: NodeJS.Timeout;

    const handlePaymentStatus = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const status = params.get('collection_status') || params.get('status');
        const paymentId = params.get('collection_id') || params.get('payment_id');
        const externalReference = params.get('external_reference');

        if (!status || !paymentId || !externalReference) {
          throw new Error('Missing payment information');
        }

        await processPayment(externalReference, paymentId, status);

        if (status === 'approved') {
          // Inicia polling manual com timeout para evitar concurrency e stale closures
          const poll = async () => {
            if (!pollingActiveRef.current) return;

            const hasPlan = await checkPlanStatus();

            if (hasPlan) {
              toast.success('Plano gerado com sucesso! Redirecionando...');
              setLoading(false);
              navigate('/plan', { replace: true });
              pollingActiveRef.current = false;
            } else {
              setRetryCount(prev => {
                if (prev + 1 >= maxRetries) {
                  toast.error('Tempo esgotado para geração do plano. Por favor, contate o suporte.');
                  setError('Tempo esgotado para geração do plano.');
                  setLoading(false);
                  pollingActiveRef.current = false;
                  return prev; // não incrementa mais
                }
                return prev + 1;
              });

              if (pollingActiveRef.current) {
                pollTimeout = setTimeout(poll, retryDelay);
              }
            }
          };

          poll(); // chama primeira vez
        } else {
          // Status não aprovado ou pendente - para de carregar
          setLoading(false);
        }
      } catch (err) {
        console.error('Error processing payment status:', err);
        setError('Erro ao processar status do pagamento. Por favor, entre em contato com o suporte.');
        toast.error('Erro ao processar pagamento');
        setLoading(false);
      }
    };

    handlePaymentStatus();

    // Cleanup no unmount
    return () => {
      pollingActiveRef.current = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [location, navigate]);

  const getStatusContent = () => {
    const params = new URLSearchParams(location.search);
    const status = params.get('collection_status') || params.get('status');

    if (status === 'approved') {
      return {
        icon: <CheckCircle className="h-16 w-16 text-green-500" />,
        title: 'Pagamento Aprovado!',
        message: retryCount > 0
          ? 'Gerando seu plano personalizado... Por favor, aguarde.'
          : 'Seu plano está sendo gerado. Você será redirecionado em alguns instantes...',
        buttonText: 'Ir para Meu Plano',
        buttonAction: () => navigate('/plan', { replace: true }),
        buttonColor: 'bg-green-500 hover:bg-green-600'
      };
    } else if (status === 'pending') {
      return {
        icon: <Clock className="h-16 w-16 text-yellow-500" />,
        title: 'Pagamento Pendente',
        message: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
        buttonText: 'Voltar para Home',
        buttonAction: () => navigate('/', { replace: true }),
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
      };
    } else {
      return {
        icon: <XCircle className="h-16 w-16 text-red-500" />,
        title: 'Pagamento não Aprovado',
        message: 'Houve um problema com seu pagamento. Por favor, tente novamente.',
        buttonText: 'Tentar Novamente',
        buttonAction: () => navigate('/plans', { replace: true }),
        buttonColor: 'bg-red-500 hover:bg-red-600'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center space-y-6">
          {content.icon}
          <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
          <p className="text-gray-600">{content.message}</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {retryCount > 0 && retryCount < maxRetries && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-500">
                Tentativa {retryCount} de {maxRetries}...
              </p>
            </div>
          )}
          <button
            onClick={content.buttonAction}
            className={`w-full py-3 px-6 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${content.buttonColor}`}
          >
            <span>{content.buttonText}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentStatus;
