import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, Activity, Calendar, User, Target, Scale, Ruler } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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
  notes?: string[];
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
  warmup: { name: string; duration: string }[];
  cooldown: { name: string; duration: string }[];
}

function TrainingPlan({ userRegistration, isPrintMode = false }: TrainingPlanProps) {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingPlan();
  }, [userRegistration]);

  const formatGoal = (goal: string): string => {
    const goalMap: { [key: string]: string } = {
      'emagrecer': 'Emagrecimento',
      'massa': 'Ganho de Massa Muscular',
      'definicao': 'Definição Muscular',
      'definicao_massa': 'Definição e Ganho de Massa',
      'emagrecer_massa': 'Emagrecimento e Massa Muscular'
    };
    return goalMap[goal] || goal;
  };

  const loadTrainingPlan = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check for existing plan
      const { data: existingPlan } = await supabase
        .from('training_plans')
        .select(`
          *,
          workout_days (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingPlan) {
        // Transform stored plan data into workoutDays format
        const transformedDays = existingPlan.workout_days.map((day: any) => ({
          day: day.day_name,
          exercises: day.exercises,
          warmup: day.warmup,
          cooldown: day.cooldown
        }));
        setWorkoutDays(transformedDays);
      } else {
        // Generate new plan based on user preferences
        const newPlan = generateWorkoutPlan();
        await saveTrainingPlan(newPlan);
        setWorkoutDays(newPlan);
      }
    } catch (error) {
      console.error('Error loading training plan:', error);
      toast.error('Erro ao carregar plano de treino');
      // Generate temporary plan without saving
      const tempPlan = generateWorkoutPlan();
      setWorkoutDays(tempPlan);
    } finally {
      setLoading(false);
    }
  };

  const generateWorkoutPlan = (): WorkoutDay[] => {
    const { activity_level, training_preference } = userRegistration;
    const isGym = training_preference?.includes('academia');
    
    let daysPerWeek = 3;
    let exercisesPerDay = 6;
    let intensity: 'Iniciante' | 'Intermediário' | 'Avançado' = 'Iniciante';

    // Determine training parameters based on activity level
    switch (activity_level) {
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

    const workoutDays: WorkoutDay[] = [];
    const workoutTypes = isGym ? 
      ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros e Abdômen', 'Full Body', 'Cardio e Core'] :
      ['Parte Superior', 'Parte Inferior', 'Core e Cardio', 'Full Body', 'Mobilidade', 'Resistência'];

    const standardWarmup = [
      { name: 'Mobilidade Articular', duration: '3 minutos' },
      { name: 'Caminhada Leve', duration: '5 minutos' },
      { name: 'Alongamento Dinâmico', duration: '5 minutos' }
    ];

    const standardCooldown = [
      { name: 'Alongamento Estático', duration: '5 minutos' },
      { name: 'Respiração Profunda', duration: '2 minutos' }
    ];

    for (let i = 0; i < daysPerWeek; i++) {
      const workoutType = workoutTypes[i % workoutTypes.length];
      const exercises: Exercise[] = [];

      // Generate exercises based on workout type and location
      if (isGym) {
        switch (workoutType) {
          case 'Peito e Tríceps':
            exercises.push(
              { name: 'Supino Reto', sets: '4', reps: '12', rest: '60s' },
              { name: 'Supino Inclinado', sets: '3', reps: '12', rest: '60s' },
              { name: 'Crucifixo', sets: '3', reps: '15', rest: '45s' },
              { name: 'Extensão de Tríceps Corda', sets: '3', reps: '15', rest: '45s' },
              { name: 'Extensão de Tríceps Testa', sets: '3', reps: '12', rest: '45s' }
            );
            break;
          case 'Costas e Bíceps':
            exercises.push(
              { name: 'Puxada na Frente', sets: '4', reps: '12', rest: '60s' },
              { name: 'Remada Baixa', sets: '3', reps: '12', rest: '60s' },
              { name: 'Remada Curvada', sets: '3', reps: '12', rest: '60s' },
              { name: 'Rosca Direta', sets: '3', reps: '15', rest: '45s' },
              { name: 'Rosca Martelo', sets: '3', reps: '12', rest: '45s' }
            );
            break;
        }
      } else {
        // Bodyweight exercises for home workouts
        switch (workoutType) {
          case 'Parte Superior':
            exercises.push(
              { name: 'Flexão de Braço', sets: '3', reps: '10-12', rest: '45s' },
              { name: 'Dips em Cadeira', sets: '3', reps: '10-12', rest: '45s' },
              { name: 'Pike Push-up', sets: '3', reps: '8-10', rest: '45s' },
              { name: 'Prancha', sets: '3', reps: '30s', rest: '30s' }
            );
            break;
          case 'Parte Inferior':
            exercises.push(
              { name: 'Agachamento', sets: '4', reps: '15-20', rest: '45s' },
              { name: 'Afundo', sets: '3', reps: '12-15', rest: '45s' },
              { name: 'Elevação de Panturrilha', sets: '3', reps: '20-25', rest: '30s' },
              { name: 'Ponte', sets: '3', reps: '15-20', rest: '45s' }
            );
            break;
        }
      }

      workoutDays.push({
        day: `Dia ${i + 1}: ${workoutType}`,
        exercises,
        warmup: standardWarmup,
        cooldown: standardCooldown
      });
    }

    return workoutDays;
  };

  const saveTrainingPlan = async (plan: WorkoutDay[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create training plan
      const { data: trainingPlan, error: planError } = await supabase
        .from('training_plans')
        .insert([{
          user_id: user.id,
          activity_level: userRegistration.activity_level,
          training_preference: userRegistration.training_preference,
          frequency_per_week: plan.length
        }])
        .select()
        .single();

      if (planError) throw planError;

      // Create workout days
      const workoutDaysData = plan.map(day => ({
        plan_id: trainingPlan.id,
        day_name: day.day,
        exercises: day.exercises,
        warmup: day.warmup,
        cooldown: day.cooldown
      }));

      const { error: daysError } = await supabase
        .from('workout_days')
        .insert(workoutDaysData);

      if (daysError) throw daysError;
    } catch (error) {
      console.error('Error saving training plan:', error);
      throw error;
    }
  };

  const renderUserInfo = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-center text-[#6a1b9a] mb-6">
          Informações Base do Plano
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Scale className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Peso</h3>
            </div>
            <p className="text-gray-700">{userRegistration.weight} kg</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Ruler className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Altura</h3>
            </div>
            <p className="text-gray-700">{userRegistration.height} cm</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Idade</h3>
            </div>
            <p className="text-gray-700">{userRegistration.age} anos</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Target className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Objetivo</h3>
            </div>
            <p className="text-gray-700">{formatGoal(userRegistration.goal)}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg md:col-span-2">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Nível de Atividade</h3>
            </div>
            <p className="text-gray-700">{userRegistration.activity_level || 'Não especificado'}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg md:col-span-2">
            <div className="flex items-center mb-2">
              <Dumbbell className="h-5 w-5 text-[#6a1b9a] mr-2" />
              <h3 className="font-semibold text-[#6a1b9a]">Preferência de Treino</h3>
            </div>
            <p className="text-gray-700">{userRegistration.training_preference || 'Não especificado'}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {renderUserInfo()}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#f3e5f5] p-3 rounded-full">
            <Dumbbell className="h-8 w-8 text-[#6a1b9a]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#6a1b9a] mb-6">
          Seu Plano de Treino
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#6a1b9a] mb-2">Nível de Atividade</h3>
            <p className="text-gray-700">{userRegistration.activity_level || 'Moderado'}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#6a1b9a] mb-2">Preferência de Treino</h3>
            <p className="text-gray-700">{userRegistration.training_preference || 'Musculação'}</p>
          </div>
        </div>
      </div>

      {workoutDays.map((day, dayIndex) => (
        <div key={dayIndex} className="workout-day bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-[#6a1b9a] mb-6">{day.day}</h3>
          
          {/* Warmup Section */}
          <div className="warmup-section mb-6">
            <h4 className="text-lg font-medium text-[#6a1b9a] mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Aquecimento
            </h4>
            <div className="space-y-3">
              {day.warmup.map((exercise, index) => (
                <div key={index} className="flex justify-between items-center bg-purple-50 p-3 rounded-lg">
                  <span className="text-gray-700">{exercise.name}</span>
                  <span className="text-[#6a1b9a] font-medium">{exercise.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises Section */}
          <div className="exercises-section mb-6">
            <h4 className="text-lg font-medium text-[#6a1b9a] mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Exercícios
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="px-4 py-2 text-left text-[#6a1b9a]">Exercício</th>
                    <th className="px-4 py-2 text-center text-[#6a1b9a]">Séries</th>
                    <th className="px-4 py-2 text-center text-[#6a1b9a]">Repetições</th>
                    <th className="px-4 py-2 text-center text-[#6a1b9a]">Descanso</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((exercise, index) => (
                    <tr key={index} className="border-b border-purple-100">
                      <td className="px-4 py-3 text-gray-700">{exercise.name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{exercise.sets}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{exercise.reps}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{exercise.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cooldown Section */}
          <div className="cooldown-section">
            <h4 className="text-lg font-medium text-[#6a1b9a] mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Volta à Calma
            </h4>
            <div className="space-y-3">
              {day.cooldown.map((exercise, index) => (
                <div key={index} className="flex justify-between items-center bg-purple-50 p-3 rounded-lg">
                  <span className="text-gray-700">{exercise.name}</span>
                  <span className="text-[#6a1b9a] font-medium">{exercise.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Tips Section */}
      <div className="tips-section bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-[#6a1b9a] mb-4">Dicas Importantes</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Mantenha uma respiração controlada durante os exercícios</li>
          <li>Beba água regularmente durante o treino</li>
          <li>Mantenha a forma correta dos exercícios</li>
          <li>Ajuste as cargas conforme necessário</li>
          <li>Descanse adequadamente entre as séries</li>
          <li>Faça um aquecimento adequado antes de começar</li>
          <li>Não pule a volta à calma após o treino</li>
        </ul>
      </div>
    </div>
  );
}

export default TrainingPlan;