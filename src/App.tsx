import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import UpdatePassword from './components/UpdatePassword';
import Plans from './components/Plans';
import PersonalizedPlan from './components/PersonalizedPlan';
import PaymentStatus from './components/payment/PaymentStatus';
import { supabase, checkSupabaseConnection } from './lib/supabase';
import toast from 'react-hot-toast';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setConnectionError(false);
        
        console.log('Initializing app...');
        
        // Check if we're online first
        if (!navigator.onLine) {
          console.warn('Device is offline');
          setConnectionError(true);
          toast.error('Dispositivo offline. Verifique sua conexão com a internet.');
          setLoading(false);
          return;
        }

        const isConnected = await checkSupabaseConnection();
        
        if (!isConnected) {
          console.error('Failed to connect to Supabase');
          setConnectionError(true);
          setLoading(false);
          return;
        }

        console.log('Supabase connection established, checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        
        if (session) {
          console.log('User session found, checking plan status...');
          await checkPlanStatus(session.user.id);
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
        setConnectionError(true);
        
        if (error instanceof Error) {
          if (error.message.includes('No internet connection')) {
            toast.error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
          } else if (error.message.includes('Unable to connect to the server')) {
            toast.error('Não foi possível conectar ao servidor. Verifique sua conexão, firewall ou VPN.');
          } else {
            toast.error('Erro ao inicializar aplicação. Tente novamente ou contate o suporte.');
          }
        } else {
          toast.error('Erro desconhecido ao inicializar aplicação.');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Device came online');
      if (connectionError) {
        toast.success('Conexão restaurada. Tentando reconectar...');
        setRetryCount(prev => prev + 1);
      }
    };

    const handleOffline = () => {
      console.log('Device went offline');
      setConnectionError(true);
      toast.error('Conexão perdida. Verifique sua internet.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setIsLoggedIn(!!session);
      if (session) {
        checkPlanStatus(session.user.id);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      subscription.unsubscribe();
    };
  }, [retryCount]);

  const checkPlanStatus = async (userId: string) => {
    try {
      console.log('Checking plan status for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid_plan')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code === 'PGRST116') {
        console.log('Profiles table not found - user might be new');
        setHasPaidPlan(false);
        return;
      }

      if (error) {
        console.error('Error checking plan status:', error);
        return;
      }
      
      const hasPlan = data?.has_paid_plan || false;
      console.log('User has paid plan:', hasPlan);
      setHasPaidPlan(hasPlan);
    } catch (error) {
      console.error('Error checking plan status:', error);
      setHasPaidPlan(false);
    }
  };

  const handleShowSignUp = () => {
    setShowSignUp(true);
    setShowReset(false);
  };

  const handleShowReset = () => {
    setShowReset(true);
    setShowSignUp(false);
  };

  const handleBackToLogin = () => {
    setShowSignUp(false);
    setShowReset(false);
  };

  const handleRetry = () => {
    console.log('Manual retry triggered');
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Conectando ao servidor...</p>
          <p className="text-emerald-600 text-sm mt-2">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center p-4">
        <div className="text-center max-w-lg bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Erro de Conexão
          </h2>
          
          <div className="text-gray-600 mb-6 text-left">
            <p className="mb-4">
              Não foi possível conectar ao servidor. Isso pode ser causado por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Problemas de conexão com a internet</li>
              <li>Firewall ou antivírus bloqueando a conexão</li>
              <li>Configurações de VPN ou proxy</li>
              <li>Manutenção temporária do servidor</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Tentar Novamente
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Recarregar Página
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Se o problema persistir, tente desabilitar temporariamente 
              seu firewall, VPN ou antivírus, ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Dashboard />
            ) : showSignUp ? (
              <SignUp onBackToLogin={handleBackToLogin} />
            ) : showReset ? (
              <ResetPassword onBackToLogin={handleBackToLogin} />
            ) : (
              <Login 
                onSignUp={handleShowSignUp}
                onReset={handleShowReset}
              />
            )
          }
        />
        <Route
          path="/plans"
          element={isLoggedIn ? <Plans /> : <Navigate to="/" />}
        />
        <Route
          path="/plan"
          element={
            isLoggedIn && hasPaidPlan ? (
              <PersonalizedPlan />
            ) : (
              <Navigate to="/plans" />
            )
          }
        />
        <Route
          path="/reset-password"
          element={<UpdatePassword />}
        />
        <Route
          path="/payment/success"
          element={isLoggedIn ? <PaymentStatus /> : <Navigate to="/" />}
        />
        <Route
          path="/payment/failure"
          element={isLoggedIn ? <PaymentStatus /> : <Navigate to="/" />}
        />
        <Route
          path="/payment/pending"
          element={isLoggedIn ? <PaymentStatus /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;