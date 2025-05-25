import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Clock, Dumbbell, Target, Calendar, Activity } from 'lucide-react';
import MetricsCard from './MetricsCard';

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
  exercises: Exercise[];
  cooldown: string[];
  tips: string[];
}
// Definição simplificada dos exercícios para academia e casa, com os tipos corretos
const EXERCICIOS_ACADEMIA: Exercise[] = [
  { name: 'Supino Reto', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Crucifixo', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Remada Curvada', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Rosca Direta', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Tríceps Pulley', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Leg Press', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Agachamento', sets: '3', reps: '10', rest: '60s', notes: [] },
  { name: 'Panturrilha', sets: '3', reps: '15', rest: '45s', notes: [] },
];

const EXERCICIOS_CASA: Exercise[] = [
  { name: 'Flexão de Braço', sets: '3', reps: '12', rest: '45s', notes: [] },
  { name: 'Dips em Cadeira', sets: '3', reps: '12', rest: '45s', notes: [] },
  { name: 'Superman', sets: '3', reps: '15', rest: '30s', notes: [] },
  { name: 'Agachamento Livre', sets: '3', reps: '15', rest: '45s', notes: [] },
  { name: 'Abdominal', sets: '3', reps: '20', rest: '30s', notes: [] },
  { name: 'Prancha', sets: '3', reps: '30s', rest: '30s', notes: [] }, // reps = duração em segundos
];

// Mapeamento para dias e exercícios por nível de atividade
const NIVEL_MAP = {
  sedentario: { dias: 2, exerciciosPorDia: 4, intensidade: 'Iniciante' },
  'levemente ativo': { dias: 3, exerciciosPorDia: 5, intensidade: 'Iniciante' },
  'moderadamente ativo': { dias: 4, exerciciosPorDia: 6, intensidade: 'Intermediário' },
  'altamente ativo': { dias: 5, exerciciosPorDia: 7, intensidade: 'Avançado' },
  'extremamente ativo': { dias: 6, exerciciosPorDia: 8, intensidade: 'Avançado' },
};
function generateWorkoutPlan(userData) {
  const niveis = {
    sedentario: { dias: 2, intensidade: 'Iniciante', exerciciosPorDia: 4 },
    leve: { dias: 3, intensidade: 'Iniciante', exerciciosPorDia: 5 },
    moderado: { dias: 4, intensidade: 'Intermediário', exerciciosPorDia: 6 },
    alto: { dias: 5, intensidade: 'Avançado', exerciciosPorDia: 8 },
    extremo: { dias: 6, intensidade: 'Avançado', exerciciosPorDia: 10 },
  };

  // Pegue os dados do usuário (exemplo simplificado)
  const nivel = userData.nivelAtividade.toLowerCase();

  const plano = niveis[nivel] || niveis.leve;

  const exerciciosAcademia = ['Supino Reto', 'Crucifixo', 'Remada', 'Rosca Direta'];
  const exerciciosCasa = ['Flexão', 'Dips', 'Superman', 'Agachamento'];

  const treino = [];

  for (let dia = 1; dia <= plano.dias; dia++) {
    treino.push({
      dia: dia,
      intensidade: plano.intensidade,
      exercicios: (userData.prefereAcademia ? exerciciosAcademia : exerciciosCasa).slice(0, plano.exerciciosPorDia),
    });
  }

  return treino;
}
export default TrainingPlan;