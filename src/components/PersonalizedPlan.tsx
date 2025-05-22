import React, { useRef, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Leaf, Download, Menu as MenuIcon, Activity, ShoppingBag, Apple, Loader } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import Menu from './Menu';
import NutritionPlan from './plan/NutritionPlan';
import TrainingPlan from './plan/TrainingPlan';
import ShoppingList from './plan/ShoppingList';
import { supabase, safeQuery } from '../lib/supabase';

interface UserRegistration {
  weight: number;
  height: number;
  age: number;
  goal: string;
  calories_target: string;
  gender: 'male' | 'female';
  activity_level?: string;
  training_preference?: string;
}

interface PersonalizedPlanProps {
  isGenerating?: boolean;
}

function PersonalizedPlan({ isGenerating = false }: PersonalizedPlanProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRegistration, setUserRegistration] = useState<UserRegistration | null>(null);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Você precisa estar logado para acessar esta página');
          return;
        }

        setUserEmail(user.email);

        const { data: registration, error } = await safeQuery(() =>
          supabase
            .from('registrations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        );

        if (error && error.message !== 'No rows found') {
          console.error('Error fetching registration:', error);
          toast.error('Erro ao carregar suas informações');
          return;
        }

        if (registration) {
          setUserRegistration(registration);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      interval = setInterval(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: plan } = await supabase
            .from('nutritional_plans')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (plan) {
            window.location.reload();
          } else {
            setRetryCount(prev => {
              if (prev >= 10) { // Max 10 retries (50 seconds)
                clearInterval(interval);
                return prev;
              }
              return prev + 1;
            });
          }
        } catch (error) {
          console.error('Error checking plan status:', error);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating]);

  const handleDownloadPDF = async (currentSectionOnly: boolean = false) => {
    if (!contentRef.current) return;

    try {
      setGeneratingPDF(true);
      setIsPrintMode(true);
      toast.loading('Gerando seu PDF...');

      await new Promise(resolve => setTimeout(resolve, 100));

      const element = contentRef.current;
      const targetElement = currentSectionOnly 
        ? element.querySelector(`#${activeTab}-section`)
        : element;

      if (!targetElement) {
        throw new Error('Elemento não encontrado');
      }

      const opt = {
        margin: [15, 15, 15, 15],
        filename: `vita-balance-${currentSectionOnly ? activeTab : 'plano-completo'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          windowWidth: 1200,
          onclone: function(clonedDoc: Document) {
            const nav = clonedDoc.querySelector('.navigation-controls');
            if (nav) nav.remove();

            const pdfButtons = clonedDoc.querySelector('.pdf-buttons');
            if (pdfButtons) pdfButtons.remove();

            if (!currentSectionOnly) {
              const sections = clonedDoc.querySelectorAll('.section-content');
              sections.forEach((section, index) => {
                (section as HTMLElement).style.display = 'block';
                if (index > 0) {
                  section.classList.add('force-break');
                }
              });
            }

            const workoutDays = clonedDoc.querySelectorAll('.workout-day');
            workoutDays.forEach((day, index) => {
              if (index > 0) {
                day.classList.add('force-break');
              }
              day.classList.add('keep-together');
            });

            const mealCards = clonedDoc.querySelectorAll('.meal-card');
            mealCards.forEach((meal, index) => {
              if (index > 0) {
                meal.classList.add('force-break');
              }
              meal.classList.add('keep-together');
            });

            const keepTogether = clonedDoc.querySelectorAll('.metrics-grid, .info-card, table, .exercise-section, .warmup-section, .cooldown-section, .tips-section');
            keepTogether.forEach(element => {
              element.classList.add('keep-together');
            });

            const sections = clonedDoc.querySelectorAll('.section-content');
            sections.forEach((section, index) => {
              if (index > 0) {
                section.classList.add('section-spacing');
              }
            });

            const sectionHeaders = clonedDoc.querySelectorAll('.section-header');
            sectionHeaders.forEach(header => {
              header.classList.add('keep-together');
            });
          }
        },
        jsPDF: { 
          unit: 'px', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
          hotfixes: ['px_scaling']
        }
      };

      await html2pdf().set(opt).from(targetElement).save();
      toast.dismiss();
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPDF(false);
      setIsPrintMode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6a1b9a]"></div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <Loader className="h-12 w-12 text-[#6a1b9a] animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-[#6a1b9a] mb-4">
            Gerando seu Plano Personalizado
          </h2>
          <p className="text-gray-600 mb-4">
            Estamos criando seu plano nutricional personalizado. 
            Isso pode levar alguns minutos.
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Tempo estimado: {Math.max(0, 50 - (retryCount * 5))} segundos
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!userRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#6a1b9a] mb-4">
            Nenhum plano encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            Parece que você ainda não criou seu plano personalizado.
            Complete seu cadastro para gerar seu plano.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#6a1b9a] text-white rounded-lg hover:bg-[#5c1786] transition-colors"
          >
            Criar Meu Plano
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-[#6a1b9a] hover:text-[#5c1786] transition-colors"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="bg-[#f3e5f5] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2">
                <Leaf className="h-8 w-8 text-[#6a1b9a]" />
              </div>
              <h1 className="text-2xl font-bold text-[#6a1b9a]">Seu Plano Personalizado</h1>
            </div>
            <div className="w-6"></div>
          </div>

          <div className="navigation-controls mb-8">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === 'nutrition'
                    ? 'bg-[#6a1b9a] text-white shadow-lg scale-105'
                    : 'bg-white text-[#6a1b9a] hover:bg-purple-50'
                }`}
              >
                <Apple className="h-5 w-5 mr-2" />
                <span>Nutrição</span>
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === 'training'
                    ? 'bg-[#6a1b9a] text-white shadow-lg scale-105'
                    : 'bg-white text-[#6a1b9a] hover:bg-purple-50'
                }`}
              >
                <Activity className="h-5 w-5 mr-2" />
                <span>Treinos</span>
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === 'shopping'
                    ? 'bg-[#6a1b9a] text-white shadow-lg scale-105'
                    : 'bg-white text-[#6a1b9a] hover:bg-purple-50'
                }`}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                <span>Lista de Compras</span>
              </button>
            </div>
          </div>

          <div className="pdf-buttons mb-8 flex justify-center space-x-4">
            <button
              onClick={() => handleDownloadPDF(true)}
              disabled={generatingPDF}
              className="flex items-center px-6 py-3 bg-[#28a745] text-white rounded-lg hover:bg-[#218838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Baixar Seção Atual</span>
            </button>
            <button
              onClick={() => handleDownloadPDF(false)}
              disabled={generatingPDF}
              className="flex items-center px-6 py-3 bg-[#6a1b9a] text-white rounded-lg hover:bg-[#5c1786] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Baixar Plano Completo</span>
            </button>
          </div>

          <div ref={contentRef}>
            <div id="nutrition-section" className="section-content" style={{ display: activeTab === 'nutrition' ? 'block' : 'none' }}>
              <NutritionPlan userRegistration={userRegistration} isPrintMode={isPrintMode} />
            </div>
            <div id="training-section" className="section-content" style={{ display: activeTab === 'training' ? 'block' : 'none' }}>
              <TrainingPlan userRegistration={userRegistration} isPrintMode={isPrintMode} />
            </div>
            <div id="shopping-section" className="section-content" style={{ display: activeTab === 'shopping' ? 'block' : 'none' }}>
              <ShoppingList userRegistration={userRegistration} />
            </div>
          </div>
        </div>
      </div>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
}

export default PersonalizedPlan;