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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        const isConnected = await checkSupabaseConnection();
        
        if (!isConnected) {
          setConnectionError(true);
          toast.error('Erro de conexão com o servidor. Por favor, conecte ao Supabase primeiro.');
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        
        if (session) {
          checkPlanStatus(session.user.id);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setConnectionError(true);
        toast.error('Erro ao inicializar aplicação. Por favor, conecte ao Supabase primeiro.');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        checkPlanStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPlanStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid_plan')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code === 'PGRST116') {
        setHasPaidPlan(false);
        return;
      }

      if (error) {
        console.error('Error checking plan status:', error);
        return;
      }
      
      setHasPaidPlan(data?.has_paid_plan || false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-emerald-700 mb-4">
            Conexão não estabelecida
          </h2>
          <p className="text-gray-600 mb-6">
            Por favor, conecte ao Supabase primeiro clicando no botão "Connect to Supabase" 
            no canto superior direito da tela.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Tentar Novamente
          </button>
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
            isLoggedIn ? (
              hasPaidPlan ? (
                <PersonalizedPlan />
              ) : (
                <Navigate to="/plans" />
              )
            ) : (
              <Navigate to="/" />
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