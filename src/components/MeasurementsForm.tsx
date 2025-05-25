import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configure seu Supabase URL e chave pública
const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseAnonKey = 'sua-chave-anonima';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Gender = 'male' | 'female';

const activityMultipliers = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const goalAdjustments = {
  lose_weight: -500,
  maintain_weight: 0,
  gain_weight: 500,
};

export default function MetaCaloricaForm() {
  const [peso, setPeso] = useState<number | ''>('');
  const [altura, setAltura] = useState<number | ''>('');
  const [idade, setIdade] = useState<number | ''>('');
  const [genero, setGenero] = useState<Gender>('male');
  const [atividade, setAtividade] = useState<keyof typeof activityMultipliers>('sedentary');
  const [objetivo, setObjetivo] = useState<keyof typeof goalAdjustments>('maintain_weight');
  const [metaCalorica, setMetaCalorica] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Cálculo da taxa metabólica basal (TMB) usando Mifflin-St Jeor
  const calcularTMB = (peso: number, altura: number, idade: number, genero: Gender): number => {
    if (genero === 'male') {
      return 10 * peso + 6.25 * altura - 5 * idade + 5;
    } else {
      return 10 * peso + 6.25 * altura - 5 * idade - 161;
    }
  };

  useEffect(() => {
    if (peso && altura && idade) {
      const tmb = calcularTMB(peso, altura, idade, genero);
      const atividadeF = activityMultipliers[atividade];
      const ajusteObjetivo = goalAdjustments[objetivo];
      const total = tmb * atividadeF + ajusteObjetivo;
      setMetaCalorica(Math.round(total));
    } else {
      setMetaCalorica(null);
    }
  }, [peso, altura, idade, genero, atividade, objetivo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaCalorica) {
      setMessage('Preencha todos os campos corretamente.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      // Supondo que você tenha uma tabela chamada 'user_nutrition' com colunas: peso, altura, idade, genero, atividade, objetivo, meta_calorica
      const user = supabase.auth.user();
      if (!user) {
        setMessage('Usuário não autenticado.');
        setSaving(false);
        return;
      }
      const { error } = await supabase.from('user_nutrition').upsert({
        user_id: user.id,
        peso,
        altura,
        idade,
        genero,
        atividade,
        objetivo,
        meta_calorica: metaCalorica,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setMessage('Meta calórica salva com sucesso!');
    } catch (error) {
      setMessage('Erro ao salvar: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Calculadora de Meta Calórica</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Peso (kg):</label>
          <input
            type="number"
            min="1"
            value={peso}
            onChange={e => setPeso(Number(e.target.value))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Altura (cm):</label>
          <input
            type="number"
            min="1"
            value={altura}
            onChange={e => setAltura(Number(e.target.value))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Idade:</label>
          <input
            type="number"
            min="1"
            value={idade}
            onChange={e => setIdade(Number(e.target.value))}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Gênero:</label>
          <select
            value={genero}
            onChange={e => setGenero(e.target.value as Gender)}
            className="w-full p-2 border rounded"
          >
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </select>
        </div>
        <div>
          <label>Nível de Atividade:</label>
          <select
            value={atividade}
            onChange={e => setAtividade(e.target.value as keyof typeof activityMultipliers)}
            className="w-full p-2 border rounded"
          >
            <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
            <option value="lightly_active">Levemente ativo (exercício leve 1-3 dias/semana)</option>
            <option value="moderately_active">Moderadamente ativo (exercício moderado 3-5 dias/semana)</option>
            <option value="very_active">Muito ativo (exercício pesado 6-7 dias/semana)</option>
            <option value="extra_active">Extremamente ativo (exercício muito pesado ou trabalho físico)</option>
          </select>
        </div>
        <div>
          <label>Objetivo:</label>
          <select
            value={objetivo}
            onChange={e => setObjetivo(e.target.value as keyof typeof goalAdjustments)}
            className="w-full p-2 border rounded"
          >
            <option value="lose_weight">Perder peso</option>
            <option value="maintain_weight">Manter peso</option>
            <option value="gain_weight">Ganhar peso</option>
          </select>
        </div>

        <div>
          <label className="font-semibold">Meta Calórica Estimada:</label>
          <p className="text-lg">{metaCalorica ? `${metaCalorica} kcal/dia` : 'Preencha os dados para calcular'}</p>
        </div>

        {message && <p className="text-red-600">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Meta Calórica'}
        </button>
      </form>
    </div>
  );
}