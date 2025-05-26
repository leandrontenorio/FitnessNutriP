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
      // Se o usuário escolheu não ter treino, retorna plano vazio
      if (userRegistration.training_preference === 'Não') {
        return [];
      }

      const activityLevel = userRegistration.activity_level || 'Sedentário';
      const isGymTraining = (userRegistration.training_preference || '').includes('academia');
      setIsGym(isGymTraining);

      let daysPerWeek = 3;
      let exercisesPerDay = 6;
      let intensity: 'Iniciante' | 'Intermediário' | 'Avançado' = 'Iniciante';

      // Determinar parâmetros do treino baseado no nível de atividade
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
                { name: 'Supino Reto', sets: baseSets, reps: '12', rest: baseRest, notes: ['Mantenha os cotovelos alinhados'] },
                { name: 'Crucifixo', sets: baseSets, reps: '12', rest: baseRest, notes: ['Movimento controlado'] },
                { name: 'Extensão de Tríceps', sets: baseSets, reps: '12', rest: baseRest, notes: ['Cotovelos junto ao corpo'] }
              );
              break;
            case 'Costas e Bíceps':
              exercises.push(
                { name: 'Puxada na Frente', sets: baseSets, reps: '12', rest: baseRest, notes: ['Costas retas'] },
                { name: 'Remada Baixa', sets: baseSets, reps: '12', rest: baseRest, notes: ['Cotovelos próximos'] },
                { name: 'Rosca Direta', sets: baseSets, reps: '12', rest: baseRest, notes: ['Movimento controlado'] }
              );
              break;
            case 'Pernas':
              exercises.push(
                { name: 'Agachamento', sets: baseSets, reps: '12', rest: baseRest, notes: ['Joelhos alinhados'] },
                { name: 'Leg Press', sets: baseSets, reps: '12', rest: baseRest, notes: ['Respiração controlada'] },
                { name: 'Extensão de Pernas', sets: baseSets, reps: '12', rest: baseRest, notes: ['Movimento completo'] }
              );
              break;
            default:
              exercises.push(
                { name: 'Exercício Composto', sets: baseSets, reps: '12', rest: baseRest, notes: ['Manter forma correta'] }
              );
          }
        } else {
          // Exercícios para treino em casa
          switch (type) {
            case 'Parte Superior':
              exercises.push(
                { name: 'Flexão de Braço', sets: baseSets, reps: '10', rest: baseRest, notes: ['Core ativado'] },
                { name: 'Dips em Cadeira', sets: baseSets, reps: '10', rest: baseRest, notes: ['Cotovelos junto ao corpo'] },
                { name: 'Pike Push-up', sets: baseSets, reps: '8', rest: baseRest, notes: ['Movimento controlado'] }
              );
              break;
            case 'Parte Inferior':
              exercises.push(
                { name: 'Agachamento', sets: baseSets, reps: '15', rest: baseRest, notes: ['Joelhos alinhados'] },
                { name: 'Afundo', sets: baseSets, reps: '12', rest: baseRest, notes: ['Postura ereta'] },
                { name: 'Elevação de Panturrilha', sets: baseSets, reps: '20', rest: baseRest, notes: ['Movimento completo'] }
              );
              break;
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

  // Se o usuário escolheu não ter treino, mostra mensagem
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
      {/* Metrics Cards */}
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
          value={workoutPlan[0]?.intensity || 'Iniciante'}
          status="nível"
          description="Baseado no seu perfil atual"
          icon={<Activity className="h-5 w-5" />}
          isPrintMode={isPrintMode}
        />
        <MetricsCard
          title="Duração Média"
          value={(workoutPlan[0]?.duration || '0').split(' ')[0]}
          status="minutos"
          description="Tempo estimado por sessão"
          icon={<Clock className="h-5 w-5" />}
          isPrintMode={isPrintMode}
        />
        <MetricsCard
          title="Exercícios"
          value={(workoutPlan[0]?.exercises.length || 0).toString()}
          status="por treino"
          description="Quantidade ideal por sessão"
          icon={<Dumbbell className="h-5 w-5" />}
          isPrintMode={isPrintMode}
        />
      </div>

      {/* Workout Days */}
      <div className="space-y-4">
        {workoutPlan.map((day) => (
          <div key={day.id} className="workout-day bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => !isPrintMode && setExpandedDay(expandedDay === day.id ? null : day.id)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-[#6a1b9a]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#6a1b9a]">{day.title}</h3>
                  <p className="text-sm text-purple-600">{day.duration}</p>
                </div>
              </div>
              {!isPrintMode && (
                <ChevronDown
                  className={`h-5 w-5 text-purple-400 transform transition-transform ${
                    expandedDay === day.id ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {(isPrintMode || expandedDay === day.id) && (
              <div className="border-t border-purple-100">
                <div className="p-6 bg-gradient-to-br from-purple-50 via-white to-purple-50">
                  {/* Warmup Section */}
                  <div className="warmup-section mb-6">
                    <h4 className="font-medium text-[#6a1b9a] mb-3">Aquecimento</h4>
                    <ul className="space-y-2">
                      {day.warmup.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exercises Section */}
                  <div className="exercises-section mb-6">
                    <h4 className="font-medium text-[#6a1b9a] mb-3">Exercícios</h4>
                    <div className="grid gap-4">
                      {day.exercises.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-4 rounded-lg shadow-sm border border-purple-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{exercise.name}</h5>
                            <div className="text-sm">
                              <span className="text-purple-600">{exercise.sets}</span>
                              <span className="text-gray-400"> × </span>
                              <span className="text-purple-600">{exercise.reps}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            Descanso: {exercise.rest}
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {exercise.notes.map((note, noteIdx) => (
                              <li key={noteIdx} className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooldown Section */}
                  <div className="cooldown-section mb-6">
                    <h4 className="font-medium text-[#6a1b9a] mb-3">Finalização</h4>
                    <ul className="space-y-2">
                      {day.cooldown.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tips Section */}
                  <div className="tips-section bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-[#6a1b9a] mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Dicas para este treino
                    </h4>
                    <ul className="space-y-2">
                      {day.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-[#6a1b9a] rounded-full"></div>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrainingPlan;