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
  muscleGroup?: string;
  equipment?: string;
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

  // Map user goals to database objectives
  const mapGoalToObjective = (goal: string): string => {
    const goalMap: { [key: string]: string } = {
      'emagrecer': 'emagrecimento',
      'massa': 'ganho_massa',
      'definicao': 'definicao',
      'definicao_massa': 'definicao',
      'emagrecer_massa': 'emagrecimento'
    };
    return goalMap[goal] || 'definicao';
  };

  // Determine intensity level based on activity level
  const getIntensityLevel = (activityLevel: string): 'Iniciante' | 'Intermediário' | 'Avançado' => {
    if (activityLevel?.includes('Sedentário') || activityLevel?.includes('Levemente ativo')) {
      return 'Iniciante';
    } else if (activityLevel?.includes('Moderadamente ativo')) {
      return 'Intermediário';
    } else {
      return 'Avançado';
    }
  };

  // Normalize muscle group names for better matching
  const normalizeMuscleGroup = (group: string): string => {
    const normalized = group.toLowerCase().trim();
    
    // Map variations to standard names
    const muscleGroupMap: { [key: string]: string } = {
      'peito': 'peito',
      'peitoral': 'peito',
      'chest': 'peito',
      'costas': 'costas',
      'back': 'costas',
      'dorsal': 'costas',
      'pernas': 'pernas',
      'legs': 'pernas',
      'quadriceps': 'pernas',
      'posterior': 'pernas',
      'coxa': 'pernas',
      'glúteos': 'glúteos',
      'gluteo': 'glúteos',
      'glutes': 'glúteos',
      'bumbum': 'glúteos',
      'ombros': 'ombros',
      'ombro': 'ombros',
      'shoulders': 'ombros',
      'deltoides': 'ombros',
      'deltoide': 'ombros',
      'bíceps': 'bíceps',
      'biceps': 'bíceps',
      'bicep': 'bíceps',
      'tríceps': 'tríceps',
      'triceps': 'tríceps',
      'tricep': 'tríceps',
      'abdômen': 'abdômen',
      'abdomen': 'abdômen',
      'abs': 'abdômen',
      'core': 'abdômen',
      'abdominal': 'abdômen',
      'braços': 'braços',
      'bracos': 'braços',
      'arms': 'braços',
      'antebraço': 'braços',
      'antebraco': 'braços'
    };

    return muscleGroupMap[normalized] || normalized;
  };

  // Define workout day configurations with specific muscle groups
  const getWorkoutDayConfigs = (intensity: 'Iniciante' | 'Intermediário' | 'Avançado') => {
    const configs = {
      'Iniciante': [
        {
          title: 'Peito e Tríceps',
          muscleGroups: ['peito', 'tríceps'],
          exercisesPerGroup: { 'peito': 2, 'tríceps': 2 },
          duration: 35
        },
        {
          title: 'Costas e Bíceps',
          muscleGroups: ['costas', 'bíceps'],
          exercisesPerGroup: { 'costas': 2, 'bíceps': 2 },
          duration: 35
        },
        {
          title: 'Pernas e Glúteos',
          muscleGroups: ['pernas', 'glúteos'],
          exercisesPerGroup: { 'pernas': 3, 'glúteos': 1 },
          duration: 40
        }
      ],
      'Intermediário': [
        {
          title: 'Peito e Tríceps',
          muscleGroups: ['peito', 'tríceps'],
          exercisesPerGroup: { 'peito': 3, 'tríceps': 2 },
          duration: 45
        },
        {
          title: 'Costas e Bíceps',
          muscleGroups: ['costas', 'bíceps'],
          exercisesPerGroup: { 'costas': 3, 'bíceps': 2 },
          duration: 45
        },
        {
          title: 'Pernas e Glúteos',
          muscleGroups: ['pernas', 'glúteos'],
          exercisesPerGroup: { 'pernas': 3, 'glúteos': 2 },
          duration: 50
        },
        {
          title: 'Ombros e Abdômen',
          muscleGroups: ['ombros', 'abdômen'],
          exercisesPerGroup: { 'ombros': 3, 'abdômen': 2 },
          duration: 40
        }
      ],
      'Avançado': [
        {
          title: 'Peito e Tríceps',
          muscleGroups: ['peito', 'tríceps'],
          exercisesPerGroup: { 'peito': 4, 'tríceps': 2 },
          duration: 60
        },
        {
          title: 'Costas e Bíceps',
          muscleGroups: ['costas', 'bíceps'],
          exercisesPerGroup: { 'costas': 4, 'bíceps': 2 },
          duration: 60
        },
        {
          title: 'Pernas e Glúteos',
          muscleGroups: ['pernas', 'glúteos'],
          exercisesPerGroup: { 'pernas': 4, 'glúteos': 2 },
          duration: 65
        },
        {
          title: 'Ombros e Abdômen',
          muscleGroups: ['ombros', 'abdômen'],
          exercisesPerGroup: { 'ombros': 3, 'abdômen': 3 },
          duration: 50
        },
        {
          title: 'Braços Completo',
          muscleGroups: ['bíceps', 'tríceps'],
          exercisesPerGroup: { 'bíceps': 3, 'tríceps': 3 },
          duration: 45
        }
      ]
    };

    return configs[intensity];
  };

  // Fetch exercises from Supabase and generate workout
  const fetchAndGenerateWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      const objective = mapGoalToObjective(userRegistration.goal);
      const intensity = getIntensityLevel(userRegistration.activity_level || '');
      const isGym = userRegistration.training_preference?.includes('academia') || false;

      // Map intensity to database level
      const levelMap = {
        'Iniciante': 'iniciante',
        'Intermediário': 'intermediario',
        'Avançado': 'avancado'
      };
      const dbLevel = levelMap[intensity];

      console.log('🏋️ Buscando exercícios:', { 
        objetivo: objective, 
        nivel: dbLevel, 
        academia: isGym,
        preferencia: userRegistration.training_preference 
      });

      // Fetch all exercises that match the criteria
      let query = supabase
        .from('exercises')
        .select('*')
        .eq('nivel', dbLevel)
        .ilike('objetivos', `%${objective}%`)
        .limit(100); // Increased limit to get more variety

      // Filter by equipment type
      if (isGym) {
        query = query.neq('equipamento', 'Peso Corporal');
      } else {
        query = query.in('equipamento', ['Peso Corporal', 'Halteres']);
      }

      const { data: exercises, error: fetchError } = await query;

      if (fetchError) {
        console.error('❌ Erro na consulta Supabase:', fetchError);
        throw new Error(`Erro ao buscar exercícios: ${fetchError.message}`);
      }

      if (!exercises || exercises.length < 10) {
        console.warn('⚠️ Poucos exercícios encontrados, tentando consulta alternativa...');

        let fallbackQuery = supabase
          .from('exercises')
          .select('*')
          .eq('nivel', dbLevel)
          .limit(100);

        if (isGym) {
          fallbackQuery = fallbackQuery.neq('equipamento', 'Peso Corporal');
        } else {
          fallbackQuery = fallbackQuery.in('equipamento', ['Peso Corporal', 'Halteres']);
        }

        const { data: fallbackExercises, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
          throw new Error(`Erro ao buscar exercícios alternativos: ${fallbackError.message}`);
        }

        if (!fallbackExercises || fallbackExercises.length === 0) {
          console.log('⚠️ Nenhum exercício encontrado, usando plano estático');
          return generateFallbackPlan();
        }

        return generateWorkoutPlan(fallbackExercises, intensity);
      }

      return generateWorkoutPlan(exercises, intensity);

    } catch (error) {
      console.error('❌ Erro em fetchAndGenerateWorkout:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar exercícios do banco de dados');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate workout plan from exercises with strict muscle group filtering
  const generateWorkoutPlan = (exercises: any[], intensity: 'Iniciante' | 'Intermediário' | 'Avançado'): WorkoutDay[] => {
    console.log(`🎯 Gerando plano de treino com ${exercises.length} exercícios`);

    const workoutConfigs = getWorkoutDayConfigs(intensity);
    const workoutDays: WorkoutDay[] = [];

    // Organize exercises by normalized muscle group
    const exercisesByMuscleGroup: { [key: string]: any[] } = {};
    
    exercises.forEach(exercise => {
      const normalizedGroup = normalizeMuscleGroup(exercise.grupo_muscular || '');
      if (!exercisesByMuscleGroup[normalizedGroup]) {
        exercisesByMuscleGroup[normalizedGroup] = [];
      }
      exercisesByMuscleGroup[normalizedGroup].push(exercise);
    });

    console.log('📊 Exercícios por grupo muscular:', Object.keys(exercisesByMuscleGroup).map(group => 
      `${group}: ${exercisesByMuscleGroup[group].length}`
    ));

    workoutConfigs.forEach((config, dayIndex) => {
      const dayExercises: any[] = [];
      
      // For each muscle group in this day's configuration
      config.muscleGroups.forEach(targetMuscleGroup => {
        const requiredCount = config.exercisesPerGroup[targetMuscleGroup] || 1;
        const availableExercises = exercisesByMuscleGroup[targetMuscleGroup] || [];
        
        if (availableExercises.length > 0) {
          // Shuffle and take required number of exercises
          const shuffledExercises = shuffleArray(availableExercises);
          const selectedExercises = shuffledExercises.slice(0, requiredCount);
          dayExercises.push(...selectedExercises);
          
          console.log(`✅ Dia ${dayIndex + 1} - ${targetMuscleGroup}: ${selectedExercises.length}/${requiredCount} exercícios`);
        } else {
          console.warn(`⚠️ Nenhum exercício encontrado para ${targetMuscleGroup}`);
        }
      });

      // If we don't have enough exercises, try to find similar muscle groups
      const totalRequired = Object.values(config.exercisesPerGroup).reduce((sum, count) => sum + count, 0);
      if (dayExercises.length < totalRequired) {
        console.warn(`⚠️ Dia ${dayIndex + 1}: Apenas ${dayExercises.length}/${totalRequired} exercícios encontrados`);
        
        // Try to fill with exercises from related muscle groups
        const relatedGroups = getRelatedMuscleGroups(config.muscleGroups);
        for (const relatedGroup of relatedGroups) {
          if (dayExercises.length >= totalRequired) break;
          
          const relatedExercises = exercisesByMuscleGroup[relatedGroup] || [];
          if (relatedExercises.length > 0) {
            const needed = totalRequired - dayExercises.length;
            const shuffled = shuffleArray(relatedExercises);
            const additional = shuffled.slice(0, needed);
            dayExercises.push(...additional);
            console.log(`🔄 Adicionados ${additional.length} exercícios de ${relatedGroup}`);
          }
        }
      }

      // Format exercises for the workout day
      const formattedExercises: Exercise[] = dayExercises.map(ex => ({
        name: ex.nome || 'Exercício',
        sets: ex.series?.toString() || '3',
        reps: ex.repeticoes || '10-12',
        rest: ex.descanso || '60s',
        notes: ex.observacoes ? [ex.observacoes] : ['Execute com boa forma'],
        muscleGroup: ex.grupo_muscular || '',
        equipment: ex.equipamento || ''
      }));

      workoutDays.push({
        id: `day-${dayIndex + 1}`,
        title: `Dia ${dayIndex + 1}: ${config.title}`,
        intensity,
        duration: `${config.duration} minutos`,
        warmup: [
          'Mobilidade articular - 5 minutos',
          'Alongamento dinâmico - 5 minutos',
          'Aquecimento específico - 5 minutos'
        ],
        exercises: formattedExercises,
        cooldown: [
          'Alongamento estático - 5 minutos',
          'Respiração e relaxamento - 3 minutos'
        ],
        tips: [
          'Mantenha-se hidratado durante o treino',
          'Foque na execução correta dos movimentos',
          'Ajuste as cargas conforme necessário',
          'Respeite os tempos de descanso'
        ]
      });
    });

    console.log(`✅ Plano gerado com ${workoutDays.length} dias e grupos musculares específicos`);
    return workoutDays;
  };

  // Get related muscle groups for fallback
  const getRelatedMuscleGroups = (primaryGroups: string[]): string[] => {
    const relations: { [key: string]: string[] } = {
      'peito': ['ombros', 'tríceps'],
      'costas': ['bíceps', 'ombros'],
      'pernas': ['glúteos'],
      'glúteos': ['pernas'],
      'ombros': ['peito', 'tríceps'],
      'bíceps': ['costas'],
      'tríceps': ['peito', 'ombros'],
      'abdômen': ['ombros']
    };

    const related: string[] = [];
    primaryGroups.forEach(group => {
      const relatedGroups = relations[group] || [];
      related.push(...relatedGroups);
    });

    // Remove duplicates and primary groups
    return [...new Set(related)].filter(group => !primaryGroups.includes(group));
  };

  useEffect(() => {
    const generatePlan = async () => {
      // If user chose not to include training
      if (userRegistration.training_preference === 'Não') {
        console.log('ℹ️ Usuário optou por não incluir treinos');
        setWorkoutPlan([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Iniciando geração do plano de treino...');
        const plan = await fetchAndGenerateWorkout();
        setWorkoutPlan(plan);
        console.log('✅ Plano de treino gerado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao gerar plano de treino:', error);
        setError('Erro ao gerar plano de treino');
        
        // Generate fallback plan with static exercises
        console.log('🔄 Gerando plano de fallback...');
        const fallbackPlan = generateFallbackPlan();
        setWorkoutPlan(fallbackPlan);
        console.log('✅ Plano de fallback gerado');
      } finally {
        setLoading(false);
      }
    };

    generatePlan();
  }, [userRegistration]);

  // Generate fallback plan with static exercises
  const generateFallbackPlan = (): WorkoutDay[] => {
    const intensity = getIntensityLevel(userRegistration.activity_level || '');
    const isGym = userRegistration.training_preference?.includes('academia') || false;

    console.log(`🏗️ Gerando plano estático - Intensidade: ${intensity}, Academia: ${isGym}`);

    const staticExercises = isGym ? [
      { name: 'Supino Reto', sets: '3', reps: '10-12', rest: '60s', notes: ['Mantenha os cotovelos alinhados'], muscleGroup: 'Peito', equipment: 'Barra' },
      { name: 'Puxada Frontal', sets: '3', reps: '10-12', rest: '60s', notes: ['Costas retas'], muscleGroup: 'Costas', equipment: 'Máquina' },
      { name: 'Agachamento Livre', sets: '3', reps: '8-10', rest: '90s', notes: ['Joelhos alinhados aos pés'], muscleGroup: 'Pernas', equipment: 'Barra' },
      { name: 'Desenvolvimento', sets: '3', reps: '10-12', rest: '60s', notes: ['Evite usar o pescoço'], muscleGroup: 'Ombros', equipment: 'Halteres' },
      { name: 'Rosca Direta', sets: '3', reps: '10-12', rest: '45s', notes: ['Sem balanço'], muscleGroup: 'Braços', equipment: 'Halteres' },
      { name: 'Tríceps Testa', sets: '3', reps: '10-12', rest: '45s', notes: ['Cotovelos fixos'], muscleGroup: 'Braços', equipment: 'Halteres' }
    ] : [
      { name: 'Flexão de Braço', sets: '3', reps: '10-15', rest: '45s', notes: ['Core ativado'], muscleGroup: 'Peito', equipment: 'Peso Corporal' },
      { name: 'Agachamento Livre', sets: '3', reps: '15-20', rest: '45s', notes: ['Joelhos alinhados'], muscleGroup: 'Pernas', equipment: 'Peso Corporal' },
      { name: 'Prancha', sets: '3', reps: '30-60s', rest: '45s', notes: ['Core firme'], muscleGroup: 'Abdômen', equipment: 'Peso Corporal' },
      { name: 'Afundo', sets: '3', reps: '12 por perna', rest: '45s', notes: ['Postura ereta'], muscleGroup: 'Pernas', equipment: 'Peso Corporal' },
      { name: 'Burpee', sets: '3', reps: '8-12', rest: '60s', notes: ['Movimento explosivo'], muscleGroup: 'Funcional', equipment: 'Peso Corporal' },
      { name: 'Mountain Climbers', sets: '3', reps: '30s', rest: '45s', notes: ['Alta intensidade'], muscleGroup: 'Cardio', equipment: 'Peso Corporal' }
    ];

    return [{
      id: 'day-1',
      title: 'Dia 1: Treino Completo',
      intensity,
      duration: '45 minutos',
      warmup: [
        'Mobilidade articular - 5 minutos',
        'Alongamento dinâmico - 5 minutos'
      ],
      exercises: staticExercises,
      cooldown: [
        'Alongamento estático - 5 minutos',
        'Respiração e relaxamento - 3 minutos'
      ],
      tips: [
        'Mantenha-se hidratado durante o treino',
        'Foque na execução correta dos movimentos',
        'Ajuste as cargas conforme necessário'
      ]
    }];
  };

  const handleRetry = () => {
    console.log('🔄 Tentativa manual de regenerar plano...');
    setError(null);
    const generatePlan = async () => {
      try {
        setLoading(true);
        const plan = await fetchAndGenerateWorkout();
        setWorkoutPlan(plan);
      } catch (error) {
        console.error('❌ Erro na tentativa manual:', error);
        setError('Erro ao gerar plano de treino');
        const fallbackPlan = generateFallbackPlan();
        setWorkoutPlan(fallbackPlan);
      } finally {
        setLoading(false);
      }
    };
    generatePlan();
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6a1b9a]"></div>
          <h3 className="text-xl font-semibold text-gray-700">Gerando seu plano de treino...</h3>
          <p className="text-gray-600 text-center">
            Estamos buscando os melhores exercícios para seus objetivos
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-red-500">
            <Dumbbell className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700">Erro ao Carregar Treinos</h3>
          <p className="text-red-600 max-w-md">{error}</p>
          <p className="text-gray-600 text-sm max-w-md">
            Não se preocupe! Um plano básico foi gerado automaticamente para você.
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-[#6a1b9a] text-white rounded-lg hover:bg-[#5c1786] transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // If user chose not to include training
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
                          {exercise.muscleGroup && (
                            <div className="text-xs text-purple-600 mb-2">
                              {exercise.muscleGroup} • {exercise.equipment}
                            </div>
                          )}
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