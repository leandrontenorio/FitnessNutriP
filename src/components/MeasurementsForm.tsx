import React, { useState, useEffect } from 'react';
import { Scale, Ruler, Calendar, Target, Flame, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FormData {
  weight: string;
  height: string;
  age: string;
  goal: string;
  calories: string;
  gender: 'male' | 'female' | null;
}

interface ValidationErrors {
  weight?: string;
  height?: string;
  age?: string;
  goal?: string;
  calories?: string;
  gender?: string;
}

function MeasurementsForm() {
  const [formData, setFormData] = useState<FormData>({
    weight: '',
    height: '',
    age: '',
    goal: '',
    calories: '',
    gender: null
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: registration, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.message !== 'No rows found') {
        throw error;
      }

      if (registration) {
        setFormData({
          weight: registration.weight?.toString() || '',
          height: registration.height?.toString() || '',
          age: registration.age?.toString() || '',
          goal: registration.goal || '',
          calories: registration.calories_target || '',
          gender: registration.gender as 'male' | 'female' | null
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar seus dados');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
      const fieldNames: { [key: string]: string } = {
        weight: 'Peso',
        height: 'Altura',
        age: 'Idade',
        goal: 'Objetivo',
        calories: 'Meta calórica',
        gender: 'Gênero'
      };
      return ${fieldNames[name]} é obrigatório;
    }

    switch (name) {
      case 'weight':
        if (isNaN(value) || parseFloat(value) <= 0) return 'Peso deve ser um número maior que 0';
        break;
      case 'height':
        if (isNaN(value) || parseFloat(value) <= 0) return 'Altura deve ser um número maior que 0';
        break;
      case 'age':
        if (isNaN(value) || parseInt(value) <= 0) return 'Idade deve ser um número maior que 0';
        break;
    }
    return '';
  };

  const saveToDatabase = async (name: string, value: any) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const updateData: any = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (['weight', 'height', 'age'].includes(name)) {
        updateData[name] = value === '' ? null : parseFloat(value);
      } else if (name === 'calories') {
        updateData.calories_target = value === '' ? null : value;
      } else {
        updateData[name] = value === '' ? null : value;
      }

      const { error: updateError } = await supabase
        .from('registrations')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      if (['weight', 'height', 'age', 'goal', 'gender'].includes(name)) {
        if (value === '' || value === null) {
          toast.success('Campo limpo com sucesso');
        } else {
          toast.success('Dados atualizados com sucesso');
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Erro ao salvar alterações');
      loadExistingData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = async (
    name: string, 
    value: string | 'male' | 'female' | null
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveToDatabase(name, value);
    }, 500);

    setSaveTimeout(timeout);
  };

  const handleClearField = async (name: string) => {
    handleInputChange(name, '');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 py-6 px-6">
        <h2 className="text-2xl font-bold text-white text-center">Suas Medidas</h2>
        <p className="text-emerald-50 text-center mt-2">
          Preencha seus dados para um plano personalizado
        </p>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Scale className="w-4 h-4 mr-2 text-emerald-600" />
              Peso (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="Ex: 70"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className={input-primary ${errors.weight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}}
              />
              {formData.weight && (
                <button
                  type="button"
                  onClick={() => handleClearField('weight')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            {errors.weight && (
              <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Ruler className="w-4 h-4 mr-2 text-emerald-600" />
              Altura (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 170"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className={input-primary ${errors.height ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}}
              />
              {formData.height && (
                <button
                  type="button"
                  onClick={() => handleClearField('height')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            {errors.height && (
              <p className="text-red-500 text-xs mt-1">{errors.height}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
              Idade
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 25"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className={input-primary ${errors.age ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}}
              />
              {formData.age && (
                <button
                  type="button"
                  onClick={() => handleClearField('age')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            {errors.age && (
              <p className="text-red-500 text-xs mt-1">{errors.age}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Target className="w-4 h-4 mr-2 text-emerald-600" />
              Seu Objetivo
            </label>
            <select
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              className={input-primary ${errors.goal ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}}
            >
              <option value="">Selecione seu objetivo</option>
              <option value="emagrecer">Emagrecer</option>
              <option value="massa">Ganho Massa Muscular</option>
              <option value="definicao_massa">Definição + Massa Muscular</option>
              <option value="definicao">Definição</option>
              <option value="emagrecer_massa">Emagrecer + Massa Muscular</option>
            </select>
            {errors.goal && (
              <p className="text-red-500 text-xs mt-1">{errors.goal}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Flame className="w-4 h-4 mr-2 text-emerald-600" />
              Meta Calórica
            </label>
            <select
              value={formData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              className={input-primary ${errors.calories ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}}
            >
              <option value="">Calorias desejadas para a dieta 🔥</option>
              <option value="nao_sei">Não sei dizer</option>
              <option value="1200_1500">1200 a 1500 calorias</option>
              <option value="1600_1900">1600 a 1900 calorias</option>
              <option value="2000_2300">2000 a 2300 calorias</option>
              <option value="2400_2700">2400 a 2700 calorias</option>
            </select>
            {errors.calories && (
              <p className="text-red-500 text-xs mt-1">{errors.calories}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4 mr-2 text-emerald-600" />
              Gênero
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('gender', 'male')}
                className={relative px-6 py-3 rounded-lg transition-all duration-300 ${
                  formData.gender === 'male'
                    ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]'
                    : 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                } ${errors.gender ? 'border-red-500' : ''}}
              >
                <span className="font-medium">Masculino</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('gender', 'female')}
                className={relative px-6 py-3 rounded-lg transition-all duration-300 ${
                  formData.gender === 'female'
                    ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]'
                    : 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                } ${errors.gender ? 'border-red-500' : ''}}
              >
                <span className="font-medium">Feminino</span>
              </button>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>
        </div>

        {isSaving && (
          <div className="text-sm text-gray-500 text-center">
            Salvando alterações...
          </div>
        )}
      </div>
    </div>
  );
}

export default MeasurementsForm;