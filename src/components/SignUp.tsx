import React, { useState } from 'react';
import { Salad } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface SignUpProps {
  onBackToLogin: () => void;
}

function SignUp({ onBackToLogin }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !phone) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Você precisa aceitar os termos de uso');
      return;
    }

    try {
      setLoading(true);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('Erro ao criar usuário');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            email: email,
            phone: phone
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        await supabase.auth.signOut();
        throw new Error('Erro ao criar perfil');
      }

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      onBackToLogin();
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message === 'User already registered') {
        toast.error('Este email já está cadastrado. Por favor, faça login ou use outro email.');
      } else {
        toast.error('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-8">
          <div className="text-center">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Salad className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-emerald-700">Criar uma Conta</h2>
          </div>
          
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="password"
                placeholder="Crie uma senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <img
                    src="https://flagcdn.com/w20/br.png"
                    alt="Brazil"
                    className="w-5 h-auto"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Número"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
                <a
                  href="#"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm hover:underline"
                >
                  Para instruções e contato
                </a>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 border border-gray-300 rounded focus:ring-emerald-500 text-emerald-600"
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Eu estou de acordo com os{' '}
                <a href="#" className="text-emerald-600 hover:underline">
                  Termos e Condições de uso
                </a>{' '}
                da Nutri Inteligente
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              disabled={loading}
              className="w-full py-3 px-4 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ENTRAR COM CONTA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;