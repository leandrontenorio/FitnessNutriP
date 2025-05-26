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

function TrainingPlan({ userRegistration, isPrintMode = false }: TrainingPlanProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([]);
  const [isGym, setIsGym] = useState(false);

  useEffect(() => {
    const generateWorkoutPlan = () => {
      if (userRegistration.training_preference === 'Não') return [];

      const activityLevel = userRegistration.activity_level || 'Sedentário';
      const isGymTraining = (userRegistration.training_preference || '').includes('academia');
      setIsGym(isGymTraining);

      let daysPerWeek = 3;
      let exercisesPerDay = 6;
      let intensity: 'Iniciante' | 'Intermediário' | 'Avançado' = 'Iniciante';

      switch (activityLevel) {
        case 'Sedentário (pouca ou nenhuma atividade física)':
          daysPerWeek = 2;
          exercisesPerDay = 4;
          intensity = 'Iniciante';
          break;
        case 'Levemente ativo (exercícios 1 a 3 vezes por semana)':
          daysPerWeek = 3;
          exercisesPerDay = 5;
          intensity = 'Iniciante';
          break;
        case 'Moderadamente ativo (exercícios de 3 a 5 vezes por semana)':
          daysPerWeek = 4;
          exercisesPerDay = 6;
          intensity = 'Intermediário';
          break;
        case 'Altamente ativo (exercícios de 5 a 7 dias por semana)':
          daysPerWeek = 5;
          exercisesPerDay = 8;
          intensity = 'Avançado';
          break;
        case 'Extremamente ativo (exercícios todos os dias e faz trabalho braçal)':
          daysPerWeek = 6;
          exercisesPerDay = 10;
          intensity = 'Avançado';
          break;
      }

      const workoutTypes = isGymTraining ? 
        ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros e Abdômen', 'Full Body', 'Cardio e Core'] :
        ['Parte Superior', 'Parte Inferior', 'Core e Cardio', 'Full Body', 'Mobilidade', 'Resistência'];

      const generateExercises = (type: string, intensity: string): Exercise[] => {
        const exercises: Exercise[] = [];
        const baseRest = intensity === 'Iniciante' ? '45s' : intensity === 'Intermediário' ? '60s' : '90s';
        const baseSets = intensity === 'Iniciante' ? '3' : intensity === 'Intermediário' ? '4' : '5';

        if (isGymTraining) {
          switch (type) {
            case 'Peito e Tríceps':
  exercises.push(
    { name: 'Supino Reto com Barra', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Mantenha os cotovelos alinhados'] },
    { name: 'Supino Inclinado com Halteres', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Controle do movimento'] },
    { name: 'Crucifixo com Halteres', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Movimento controlado'] },
    { name: 'Crossover no Cabo', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Alongue o peitoral'] },
    { name: 'Paralelas', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Cotovelos junto ao corpo'] },
    { name: 'Tríceps Testa com Barra', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Evite esticar demais os cotovelos'] },
    { name: 'Mergulho entre Bancos', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Postura ereta'] },
    { name: 'Supino Declinado', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Foque na parte inferior do peitoral'] },
    { name: 'Tríceps na Corda', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Controle no movimento'] },
    { name: 'Pullover com Halteres', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Respiração constante'] }
  );
  break;

case 'Costas e Bíceps':
  exercises.push(
    { name: 'Puxada na Frente (Pulldown)', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Costas retas'] },
    { name: 'Barra Fixa', sets: baseSets, reps: 'Até falha', rest: baseRest, notes: ['Controle no movimento'] },
    { name: 'Remada Curvada com Barra', sets: baseSets, reps: '8-10', rest: baseRest, notes: ['Coluna neutra'] },
    { name: 'Remada Unilateral com Halteres', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Amplitude completa'] },
    { name: 'Rosca Direta com Barra', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Sem balanço'] },
    { name: 'Rosca Martelo com Halteres', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Punho neutro'] },
    { name: 'Puxada na Barra T', sets: baseSets, reps: '8-10', rest: baseRest, notes: ['Postura correta'] },
    { name: 'Rosca Concentrada', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Foco no bíceps'] },
    { name: 'Remada Cavalinho (T-Bar Row)', sets: baseSets, reps: '8-10', rest: baseRest, notes: ['Respiração constante'] },
    { name: 'Rosca Inversa', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Punho em pronação'] }
  );
  break;

case 'Pernas':
  exercises.push(
    { name: 'Agachamento Livre', sets: baseSets, reps: '8-10', rest: baseRest, notes: ['Joelhos alinhados aos pés'] },
    { name: 'Leg Press 45°', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Respiração controlada'] },
    { name: 'Mesa Flexora', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Foco no movimento'] },
    { name: 'Mesa Extensora', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Controle do peso'] },
    { name: 'Avanço com Halteres', sets: baseSets, reps: '12 por perna', rest: baseRest, notes: ['Postura ereta'] },
    { name: 'Stiff com Barra', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Alongue bem os isquiotibiais'] },
    { name: 'Cadeira Abdutora', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Movimento controlado'] },
    { name: 'Elevação de Panturrilha no Leg Press', sets: baseSets, reps: '15-20', rest: baseRest, notes: ['Amplitude completa'] },
    { name: 'Agachamento Sumô', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Pés apontando para fora'] },
    { name: 'Glúteo na Polia Baixa', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Contraia o glúteo'] }
  );
  break;

case 'Ombros e Abdômen':
  exercises.push(
    { name: 'Desenvolvimento com Halteres', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Evite usar o pescoço'] },
    { name: 'Elevação Lateral', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Movimento lateral controlado'] },
    { name: 'Prancha', sets: baseSets, reps: '30-60s', rest: baseRest, notes: ['Core firme'] },
    { name: 'Elevação Frontal com Halteres', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Controle na subida'] },
    { name: 'Arnold Press', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Amplitude total'] },
    { name: 'Abdominal Remador', sets: baseSets, reps: '15-20', rest: baseRest, notes: ['Movimento fluido'] },
    { name: 'Elevação de Pernas Suspenso', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Contraia o abdômen'] },
    { name: 'Elevação Posterior com Halteres', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Foco nos deltoides posteriores'] },
    { name: 'Crunch com Peso', sets: baseSets, reps: '15-20', rest: baseRest, notes: ['Contração máxima'] },
    { name: 'Elevação Lateral no Cabo', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Amplitude controlada'] }
  );
  break;

default:
  exercises.push(
    { name: 'Treino Funcional de Corpo Inteiro', sets: baseSets, reps: '15', rest: baseRest, notes: ['Alta intensidade'] }
  );
}
} else {
switch (type) {
  case 'Parte Superior':
    exercises.push(
      { name: 'Flexão de Braço', sets: baseSets, reps: '10-15', rest: baseRest, notes: ['Core ativado'] },
      { name: 'Dips em Cadeira', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Cotovelos junto ao corpo'] },
      { name: 'Remada com Toalha ou Elástico', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Postura correta'] },
      { name: 'Flexão com Palms-off', sets: baseSets, reps: '8-12', rest: baseRest, notes: ['Maior amplitude'] },
      { name: 'Prancha Dinâmica', sets: baseSets, reps: '30-45s', rest: baseRest, notes: ['Core ativo'] },
      { name: 'Remada Australiana', sets: baseSets, reps: '10-15', rest: baseRest, notes: ['Controle do corpo'] },
      { name: 'Pike Push-up', sets: baseSets, reps: '8-12', rest: baseRest, notes: ['Foco nos ombros'] },
      { name: 'Flexão Diamante', sets: baseSets, reps: '10-12', rest: baseRest, notes: ['Foco no tríceps'] },
      { name: 'Flexão Arqueiro', sets: baseSets, reps: '8-10', rest: baseRest, notes: ['Amplitude maior'] },
      { name: 'Prancha com Elevação Alternada de Braços', sets: baseSets, reps: '30s', rest: baseRest, notes: ['Estabilidade'] }
    );
    break;

  case 'Parte Inferior':
    exercises.push(
      { name: 'Agachamento Livre', sets: baseSets, reps: '15-20', rest: baseRest, notes: ['Joelhos alinhados'] },
      { name: 'Afundo com Peso Corporal', sets: baseSets, reps: '12 por perna', rest: baseRest, notes: ['Postura ereta'] },
      { name: 'Panturrilha em Pé', sets: baseSets, reps: '20', rest: baseRest, notes: ['Movimento completo'] },
      { name: 'Agachamento Pistola', sets: baseSets, reps: '8-10 por perna', rest: baseRest, notes: ['Controle do movimento'] },
      { name: 'Ponte de Glúteos', sets: baseSets, reps: '15-20', rest: baseRest, notes: ['Contração do glúteo'] },
      { name: 'Step-up em banco', sets: baseSets, reps: '12 por perna', rest: baseRest, notes: ['Postura ereta'] },
      { name: 'Elevação de Panturrilha em Pé', sets: baseSets, reps: '20-25', rest: baseRest, notes: ['Amplitude máxima'] },
      { name: 'Agachamento Isométrico na Parede', sets: baseSets, reps: '30-60s', rest: baseRest, notes: ['Postura correta'] },
      { name: 'Salto no Lugar (Jump Squat)', sets: baseSets, reps: '12-15', rest: baseRest, notes: ['Explosão muscular'] },
      { name: 'Avanço Dinâmico (Walking Lunge)', sets: baseSets, reps: '12 por perna', rest: baseRest, notes: ['Amplitude completa'] }
    );
    break;

  case 'Core e Cardio':
    exercises.push(
      { name: 'Abdominal Bicicleta', sets: baseSets,
            default:
              exercises.push(
                { name: 'Exercício Funcional', sets: baseSets, reps: '12', rest: baseRest, notes: ['Manter forma correta'] }
              );
          }
        }

        return exercises;
      };

      const plan: WorkoutDay[] = [];
      for (let i = 0; i < daysPerWeek; i++) {
        const workoutType = workoutTypes[i % workoutTypes.length];
        plan.push({
          id: `day-${i + 1}`,
          title: `Dia ${i + 1}: ${workoutType}`,
          intensity: intensity,
          duration: `${exercisesPerDay * 5 + 10} minutos`,
          warmup: [
            'Mobilidade articular - 3 minutos',
            'Alongamento dinâmico - 4 minutos',
            'Exercício leve de cardio - 3 minutos'
          ],
          exercises: generateExercises(workoutType, intensity),
          cooldown: [
            'Alongamento estático - 5 minutos',
            'Respiração e relaxamento - 2 minutos'
          ],
          tips: [
            'Mantenha-se hidratado durante o treino',
            'Foque na execução correta dos movimentos',
            'Ajuste as cargas conforme necessário'
          ]
        });
      }

      return plan;
    };

    setWorkoutPlan(generateWorkoutPlan());
  }, [userRegistration]);

  if (userRegistration.training_preference === 'Não') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="flex flex-col items-center space-y-4">
          <Dumbbell className="h-12 w-12 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700">Plano de Treino não Incluído</h3>
          <p className="text-gray-600 max-w-md">
            Você optou por não incluir treinos no seu plano. Se desejar adicionar treinos posteriormente, 
            você pode atualizar suas preferências na seção de configurações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Dias de Treino"
          value={workoutPlan.length.toString()}
          status="por semana"
          description="Frequência ideal para seus objetivos"
          icon={<Calendar className="h-5 w-5" />} 
          isPrintMode={isPrintMode} 
        />
        <MetricsCard
          title="Intensidade"
          value={workoutPlan[0]?.intensity || '-'}
          status="do plano"
          description="Nível baseado na sua rotina"
          icon={<Flame className="h-5 w-5" />} 
          isPrintMode={isPrintMode} 
        />
        <MetricsCard
          title="Duração Média"
          value={workoutPlan[0]?.duration || '-'}
          status="por treino"
          description="Tempo estimado de cada sessão"
          icon={<Clock className="h-5 w-5" />} 
          isPrintMode={isPrintMode} 
        />
      </div>
    </div>
  );
}

export default TrainingPlan;
