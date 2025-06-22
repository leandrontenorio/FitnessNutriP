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
  muscleGroup: string;
  equipment: string;
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
  focus: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRegistration) {
      fetchAndGenerateWorkout();
    }
  }, [userRegistration]);

  const mapGoalToObjective = (goal: string): string => {
    const goalMapping: { [key: string]: string } = {
      'emagrecer': 'emagrecimento',
      'massa': 'ganho_massa',
      'definicao': 'definicao',
      'definicao_massa': 'ganho_massa',
      'emagrecer_massa': 'emagrecimento'
    };
    return goalMapping[goal] || 'ganho_massa';
  };

  const getIntensityLevel = (): string => {
    const { activity_level } = userRegistration;
    
    if (!activity_level) return 'iniciante';
    
    if (activity_level.includes('Sedentário') || activity_level.includes('Levemente ativo')) {
      return 'iniciante';
    } else if (activity_level.includes('Moderadamente ativo')) {
      return 'intermediario';
    } else if (activity_level.includes('Altamente ativo') || activity_level.includes('Extremamente ativo')) {
      return 'avancado';
    }
    
    return 'iniciante';
  };

  const getEquipmentType = (): string => {
    const { training_preference } = userRegistration;
    
    if (!training_preference) return 'peso_corporal';
    
    if (training_preference.includes('academia')) {
      return 'academia';
    } else if (training_preference.includes('casa')) {
      return 'peso_corporal';
    }
    
    return 'peso_corporal';
  };

  const fetchAndGenerateWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Se o usuário escolheu não ter treino, retorna plano vazio
      if (userRegistration.training_preference === 'Não') {
        setWorkoutPlan([]);
        setLoading(false);
        return;
      }

      const objective = mapGoalToObjective(userRegistration.goal);
      const intensityLevel = getIntensityLevel();
      const equipmentType = getEquipmentType();

      console.log('Buscando exercícios com:', { objective, intensityLevel, equipmentType });

      // Buscar exercícios da tabela exercises
      let query = supabase
        .from('exercises')
        .select('*')
        .eq('nivel', intensityLevel);

      // Filtrar por objetivo se disponível
      if (objective) {
        query = query.contains('objetivos', [objective]);
      }

      // Filtrar por equipamento se for treino em casa
      if (equipmentType === 'peso_corporal') {
        query = query.in('equipamento', ['peso_corporal', 'elastico', 'sem_equipamento']);
      }

      const { data: exercises, error: fetchError } = await query.limit(50);

      if (fetchError) {
        console.error('Erro ao buscar exercícios:', fetchError);
        throw new Error('Erro ao carregar exercícios do banco de dados');
      }

      if (!exercises || exercises.length === 0) {
        // Fallback: buscar exercícios sem filtros específicos
        const { data: fallbackExercises, error: fallbackError } = await supabase
          .from('exercises')
          .select('*')
          .eq('nivel', intensityLevel)
          .limit(30);

        if (fallbackError || !fallbackExercises || fallbackExercises.length === 0) {
          throw new Error('Nenhum exercício encontrado no banco de dados');
        }

        generateWorkoutPlan(fallbackExercises, intensityLevel);
      } else {
        generateWorkoutPlan(exercises, intensityLevel);
      }

    } catch (err) {
      console.error('Erro ao gerar plano de treino:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const generateWorkoutPlan = (exercises: Exercise[], intensity: string) => {
    const daysPerWeek = getDaysPerWeek();
    const exercisesPerDay = getExercisesPerDay();
    
    // Agrupar exercícios por grupo muscular
    const exercisesByMuscle = exercises.reduce((acc, exercise) => {
      const muscle = exercise.grupo_muscular;
      if (!acc[muscle]) acc[muscle] = [];
      acc[muscle].push(exercise);
      return acc;
    }, {} as { [key: string]: Exercise[] });

    // Definir focos para cada dia
    const dayFocuses = getDayFocuses(daysPerWeek);
    
    const workoutDays: WorkoutDay[] = [];

    for (let i = 0; i < daysPerWeek; i++) {
      const focus = dayFocuses[i];
      const dayExercises = selectExercisesForDay(exercisesByMuscle, focus, exercisesPerDay);
      
      workoutDays.push({
        id: `day-${i + 1}`,
        title: `Dia ${i + 1}: ${focus}`,
        intensity: intensity === 'iniciante' ? 'Iniciante' : 
                  intensity === 'intermediario' ? 'Intermediário' : 'Avançado',
        duration: `${exercisesPerDay * 4 + 15} minutos`,
        focus: focus,
        warmup: getWarmupRoutine(),
        exercises: dayExercises.map(formatExercise),
        cooldown: getCooldownRoutine(),
        tips: getWorkoutTips(focus)
      });
    }

    setWorkoutPlan(workoutDays);
  };

  const getDaysPerWeek = (): number => {
    const { activity_level } = userRegistration;
    
    if (!activity_level) return 3;
    
    if (activity_level.includes('Sedentário')) return 2;
    if (activity_level.includes('Levemente ativo')) return 3;
    if (activity_level.includes('Moderadamente ativo')) return 4;
    if (activity_level.includes('Altamente ativo')) return 5;
    if (activity_level.includes('Extremamente ativo')) return 6;
    
    return 3;
  };

  const getExercisesPerDay = (): number => {
    const intensity = getIntensityLevel();
    
    switch (intensity) {
      case 'iniciante': return 4;
      case 'intermediario': return 5;
      case 'avancado': return 6;
      default: return 4;
    }
  };

  const getDayFocuses = (daysPerWeek: number): string[] => {
    const isGym = userRegistration.training_preference?.includes('academia');
    
    if (isGym) {
      switch (daysPerWeek) {
        case 2: return ['Corpo Superior', 'Corpo Inferior'];
        case 3: return ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas e Glúteos'];
        case 4: return ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas e Glúteos', 'Ombros e Core'];
        case 5: return ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços'];
        case 6: return ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros', 'Braços', 'Core e Cardio'];
        default: return ['Corpo Superior', 'Corpo Inferior', 'Full Body'];
      }
    } else {
      switch (daysPerWeek) {
        case 2: return ['Corpo Superior', 'Corpo Inferior'];
        case 3: return ['Corpo Superior', 'Corpo Inferior', 'Core e Cardio'];
        case 4: return ['Corpo Superior', 'Corpo Inferior', 'Core e Cardio', 'Full Body'];
        default: return ['Corpo Superior', 'Corpo Inferior', 'Full Body'];
      }
    }
  };

  const selectExercisesForDay = (
    exercisesByMuscle: { [key: string]: Exercise[] },
    focus: string,
    count: number
  ): Exercise[] => {
    const muscleGroups = getMuscleGroupsForFocus(focus);
    const selectedExercises: Exercise[] = [];
    
    // Distribuir exercícios pelos grupos musculares do foco
    const exercisesPerGroup = Math.ceil(count / muscleGroups.length);
    
    for (const muscleGroup of muscleGroups) {
      const availableExercises = exercisesByMuscle[muscleGroup] || [];
      const shuffled = shuffleArray(availableExercises);
      const selected = shuffled.slice(0, exercisesPerGroup);
      selectedExercises.push(...selected);
    }
    
    // Se não temos exercícios suficientes, pegar de qualquer grupo
    if (selectedExercises.length < count) {
      const allExercises = Object.values(exercisesByMuscle).flat();
      const remaining = shuffleArray(allExercises)
        .filter(ex => !selectedExercises.some(sel => sel.id === ex.id))
        .slice(0, count - selectedExercises.length);
      selectedExercises.push(...remaining);
    }
    
    return selectedExercises.slice(0, count);
  };

  const getMuscleGroupsForFocus = (focus: string): string[] => {
    const focusMapping: { [key: string]: string[] } = {
      'Peito e Tríceps': ['peito', 'triceps'],
      'Costas e Bíceps': ['costas', 'biceps'],
      'Pernas e Glúteos': ['pernas', 'gluteos', 'quadriceps', 'posterior_coxa'],
      'Ombros e Core': ['ombros', 'core', 'abdomen'],
      'Corpo Superior': ['peito', 'costas', 'ombros', 'biceps', 'triceps'],
      'Corpo Inferior': ['pernas', 'gluteos', 'quadriceps', 'posterior_coxa'],
      'Core e Cardio': ['core', 'abdomen', 'cardio'],
      'Full Body': ['peito', 'costas', 'pernas', 'ombros', 'core'],
      'Peito': ['peito'],
      'Costas': ['costas'],
      'Pernas': ['pernas', 'quadriceps', 'posterior_coxa'],
      'Ombros': ['ombros'],
      'Braços': ['biceps', 'triceps']
    };
    
    return focusMapping[focus] || ['peito', 'costas', 'pernas'];
  };

  const formatExercise = (exercise: Exercise): FormattedExercise => {
    return {
      name: exercise.nome,
      sets: `${exercise.series}`,
      reps: exercise.repeticoes,
      rest: exercise.descanso,
      notes: exercise.observacoes ? [exercise.observacoes] : [],
      muscleGroup: exercise.grupo_muscular,
      equipment: exercise.equipamento
    };
  };

  const getWarmupRoutine = (): string[] => {
    return [
      'Mobilidade articular - 3 minutos',
      'Alongamento dinâmico - 4 minutos',
      'Ativação cardiovascular leve - 3 minutos'
    ];
  };

  const getCooldownRoutine = (): string[] => {
    return [
      'Alongamento estático - 5 minutos',
      'Respiração e relaxamento - 2 minutos'
    ];
  };

  const getWorkoutTips = (focus: string): string[] => {
    const baseTips = [
      'Mantenha-se hidratado durante o treino',
      'Foque na execução correta dos movimentos',
      'Ajuste as cargas conforme necessário'
    ];

    const focusSpecificTips: { [key: string]: string[] } = {
      'Peito e Tríceps': ['Controle a descida do peso', 'Mantenha os cotovelos estáveis'],
      'Costas e Bíceps': ['Puxe com as costas, não apenas com os braços', 'Mantenha a postura ereta'],
      'Pernas e Glúteos': ['Mantenha os joelhos alinhados', 'Ative bem os glúteos'],
      'Core e Cardio': ['Mantenha o core sempre ativado', 'Respire de forma controlada']
    };

    return [...baseTips, ...(focusSpecificTips[focus] || [])];
  };

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Gerando seu plano de treino personalizado...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={fetchAndGenerateWorkout}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-${isPrintMode ? '4' : '6'}`}>
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
                  <p className="text-sm text-purple-600">{day.duration} • {day.intensity}</p>
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
                    <h4 className="font-medium text-[#6a1b9a] mb-3 flex items-center">
                      <Flame className="h-4 w-4 mr-2" />
                      Aquecimento
                    </h4>
                    <ul className="space-y-2">
                      {day.warmup.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exercises Section */}
                  <div className="exercises-section mb-6">
                    <h4 className="font-medium text-[#6a1b9a] mb-3 flex items-center">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Exercícios
                    </h4>
                    <div className="grid gap-4">
                      {day.exercises.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-4 rounded-lg shadow-sm border border-purple-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium text-gray-800">{exercise.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {exercise.muscleGroup} • {exercise.equipment}
                              </p>
                            </div>
                            <div className="text-sm text-right">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                  {exercise.sets} séries
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {exercise.reps} reps
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Descanso: {exercise.rest}
                              </div>
                            </div>
                          </div>
                          {exercise.notes.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1 mt-3">
                              {exercise.notes.map((note, noteIdx) => (
                                <li key={noteIdx} className="flex items-start space-x-2">
                                  <div className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooldown Section */}
                  <div className="cooldown-section mb-6">
                    <h4 className="font-medium text-[#6a1b9a] mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Finalização
                    </h4>
                    <ul className="space-y-2">
                      {day.cooldown.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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