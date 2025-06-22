import React, { useState, useEffect } from 'react';
import { ChevronDown, Flame, Clock, Dumbbell, Target, Calendar, Activity } from 'lucide-react';
import MetricsCard from './MetricsCard';
import { supabase } from '../../lib/supabase';

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

interface TrainingPlanProps {
  userRegistration: UserRegistration;
  isPrintMode?: boolean;
}

interface Exercise {
  id: number;
  nome: string;
  grupo_muscular: string;
  equipamento: string;
  series: number;
  repeticoes: string;
  descanso: string;
  nivel: string;
  objetivos: string[];
  observacoes: string;
  gif_url?: string;
}

interface FormattedExercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string[];
}

interface WorkoutDay {
  id: string;
  title: string;
  intensity: 'Iniciante' | 'Intermediário' | 'Avançado';
  duration: string;
  warmup: string[];
  exercises: FormattedExercise[];
  cooldown: string[];
  tips: string[];
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function TrainingPlan({ userRegistration, isPrintMode = false }: TrainingPlanProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);

  useEffect(() => {
    if (userRegistration) {
      fetchAndGenerateWorkout();
    }
  }, [userRegistration]);

  const fetchAndGenerateWorkout = async () => {
    const { goal } = userRegistration;

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .ilike('objetivos', `%${goal}%`);

    if (error || !exercises) {
      console.error('Erro ao buscar exercícios:', error);
      return;
    }

    const daysPerWeek = 4;
    const shuffled = shuffleArray(exercises);

    const workoutDays: WorkoutDay[] = Array.from({ length: daysPerWeek }, (_, i) => {
      const selected = shuffled.slice(i * 5, i * 5 + 5);
      return {
        id: `day-${i + 1}`,
        title: `Dia ${i + 1}`,
        intensity: userRegistration.activity_level === 'alta' ? 'Avançado' : userRegistration.activity_level === 'media' ? 'Intermediário' : 'Iniciante',
        duration: '45-60min',
        warmup: ['Caminhada leve 5min', 'Alongamento dinâmico'],
        exercises: selected.map((ex) => ({
          name: ex.nome,
          sets: `${ex.series} séries`,
          reps: `${ex.repeticoes} reps`,
          rest: `${ex.descanso} descanso`,
          notes: ex.observacoes ? [ex.observacoes] : [],
        })),
        cooldown: ['Alongamento geral 5min'],
        tips: ['Hidrate-se bem', 'Mantenha a postura correta']
      };
    });

    setWorkoutPlan(workoutDays);
  };

  return (
    <div>
      {/* Aqui você renderiza o plano de treino como quiser */}
    </div>
  );
}

export default TrainingPlan;
