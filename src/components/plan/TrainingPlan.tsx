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

  // 1. Mapeamento de nível de atividade para intensidade
  const getIntensityLevel = (activityLevel: string): 'Iniciante' | 'Intermediário' | 'Avançado' => {
    if (activityLevel?.includes('Sedentário') || activityLevel?.includes('Levemente ativo')) {
      return 'Iniciante';
    } else if (activityLevel?.includes('Moderadamente ativo')) {
      return 'Intermediário';
    } else if (activityLevel?.includes('Altamente ativo') || activityLevel?.includes('Extremamente ativo')) {
      return 'Avançado';
    }
    return 'Iniciante'; // Default
  };

  // 2. Mapeamento do objetivo para tag de filtro
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

  // 3. Parâmetros de volume baseados na intensidade
  const getWorkoutParams = (intensity: 'Iniciante' | 'Intermediário' | 'Avançado') => {
    const params = {
      'Iniciante': { days: 3, exercisesPerDay: 4, duration: 35 },
      'Intermediário': { days: 4, exercisesPerDay: 5, duration: 45 },
      'Avançado': { days: 5, exercisesPerDay: 6, duration: 60 }
    };
    return params[intensity];
  };

  // 4. Organização dos treinos por grupo muscular
  const getDayFocuses = () => [
    'Peito e Tríceps',
    'Costas e Bíceps', 
    'Pernas e Glúteos',
    'Ombros e Abdômen',
    'Corpo Inteiro'
  ];

  // Buscar exercícios do Supabase
  const fetchExercisesFromDatabase = async (objective: string, intensity: string, isGym: boolean) => {
    try {
      console.log('🔍 Buscando exercícios:', { objetivo: objective, nivel: intensity, academia: isGym });

      // Mapear intensidade para o banco
      const levelMap = {
        'Iniciante': 'iniciante',
        'Intermediário': 'intermediario',
        'Avançado': 'avancado'
      };
      const dbLevel = levelMap[intensity as keyof typeof levelMap];

      // Primeira tentativa: buscar com objetivo específico
      let query = supabase
        .from('exercises')
        .select('*')
        .eq('nivel', dbLevel)
        .ilike('objetivos', `%${objective}%`)
        .limit(50);

      // 3. Filtro por equipamento
      if (isGym) {
        // Academia: todos exceto peso corporal exclusivo
        query = query.neq('equipamento', 'Peso Corporal');
      } else {
        // Casa: apenas peso corporal e halteres
        query = query.in('equipamento', ['Peso Corporal', 'Halteres']);
      }

      const { data: exercises, error } = await query;

      if (error) {
        console.error('❌ Erro na consulta:', error);
        throw new Error(`Erro ao buscar exercícios: ${error.message}`);
      }

      console.log(`✅ Encontrados ${exercises?.length || 0} exercícios específicos`);

      // Se poucos exercícios, buscar sem filtro de objetivo
      if (!exercises || exercises.length < 15) {
        console.log('🔄 Buscando exercícios sem filtro de objetivo...');
        
        let fallbackQuery = supabase
          .from('exercises')
          .select('*')
          .eq('nivel', dbLevel)
          .limit(50);

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
          throw new Error('Nenhum exercício encontrado no banco de dados');
        }

        console.log(`✅ Encontrados ${fallbackExercises.length} exercícios alternativos`);
        return fallbackExercises;
      }

      return exercises;
    } catch (error) {
      console.error('❌ Erro ao buscar exercícios:', error);
      throw error;
    }
  };

  // Gerar plano de treino inteligente
  const generateIntelligentWorkoutPlan = (exercises: any[], intensity: 'Iniciante' | 'Intermediário' | 'Avançado'): WorkoutDay[] => {
    console.log(`🎯 Gerando plano inteligente com ${exercises.length} exercícios`);

    const params = getWorkoutParams(intensity);
    const dayFocuses = getDayFocuses();
    const workoutDays: WorkoutDay[] = [];

    // Organizar exercícios por grupo muscular
    const exercisesByGroup: { [key: string]: any[] } = {};
    exercises.forEach(ex => {
      const group = ex.grupo_muscular || 'Geral';
      if (!exercisesByGroup[group]) {
        exercisesByGroup[group] = [];
      }
      exercisesByGroup[group].push(ex);
    });

    // Embaralhar exercícios dentro de cada grupo
    Object.keys(exercisesByGroup).forEach(group => {
      exercisesByGroup[group] = shuffleArray(exercisesByGroup[group]);
    });

    console.log('📊 Exercícios por grupo:', Object.keys(exercisesByGroup).map(group => 
      `${group}: ${exercisesByGroup[group].length}`
    ).join(', '));

    // Função para pegar exercícios sem repetir
    const usedExercises = new Set<number>();
    const getExercisesFromGroup = (groups: string[], count: number): any[] => {
      const selected: any[] = [];
      
      for (const group of groups) {
        const available = (exercisesByGroup[group] || []).filter(ex => !usedExercises.has(ex.id));
        const needed = Math.min(count - selected.length, available.length);
        
        for (let i = 0; i < needed; i++) {
          selected.push(available[i]);
          usedExercises.add(available[i].id);
        }
        
        if (selected.length >= count) break;
      }
      
      return selected;
    };

    // Gerar cada dia de treino
    for (let i = 0; i < params.days; i++) {
      const dayFocus = dayFocuses[i] || 'Treino Geral';
      let dayExercises: any[] = [];

      // 4. Organização por grupo muscular conforme especificação
      if (dayFocus.includes('Peito')) {
        // Dia 1: Peito e Tríceps
        dayExercises = [
          ...getExercisesFromGroup(['Peito'], 2),
          ...getExercisesFromGroup(['Braços'], 2) // Tríceps está em Braços
        ];
      } else if (dayFocus.includes('Costas')) {
        // Dia 2: Costas e Bíceps
        dayExercises = [
          ...getExercisesFromGroup(['Costas'], 2),
          ...getExercisesFromGroup(['Braços'], 2) // Bíceps está em Braços
        ];
      } else if (dayFocus.includes('Pernas')) {
        // Dia 3: Pernas e Glúteos
        dayExercises = [
          ...getExercisesFromGroup(['Pernas'], 3),
          ...getExercisesFromGroup(['Abdômen'], 1) // Complemento
        ];
      } else if (dayFocus.includes('Ombros')) {
        // Dia 4: Ombros e Abdômen (apenas Intermediário e Avançado)
        dayExercises = [
          ...getExercisesFromGroup(['Ombros'], 2),
          ...getExercisesFromGroup(['Abdômen'], 2)
        ];
      } else {
        // Dia 5: Corpo inteiro / funcional (apenas Avançado)
        const allGroups = Object.keys(exercisesByGroup);
        dayExercises = getExercisesFromGroup(allGroups, params.exercisesPerDay);
      }

      // Completar com exercícios restantes se necessário
      if (dayExercises.length < params.exercisesPerDay) {
        const allGroups = Object.keys(exercisesByGroup);
        const remaining = getExercisesFromGroup(allGroups, params.exercisesPerDay - dayExercises.length);
        dayExercises.push(...remaining);
      }

      // 5. Estrutura diária do treino
      const formattedExercises: Exercise[] = dayExercises.slice(0, params.exercisesPerDay).map(ex => ({
        name: ex.nome || 'Exercício',
        sets: ex.series?.toString() || '3',
        reps: ex.repeticoes || '10-12',
        rest: ex.descanso || '60s',
        notes: ex.observacoes ? [ex.observacoes] : ['Execute com boa forma'],
        muscleGroup: ex.grupo_muscular || '',
        equipment: ex.equipamento || ''
      }));

      workoutDays.push({
        id: `day-${i + 1}`,
        title: `Dia ${i + 1}: ${dayFocus}`,
        intensity,
        duration: `${params.duration} minutos`,
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
          'Hidrate-se durante o treino',
          'Priorize boa execução dos movimentos',
          'Ajuste a carga conforme necessário',
          'Respeite os tempos de descanso'
        ]
      });
    }

    console.log(`✅ Plano inteligente gerado com ${workoutDays.length} dias de treino`);
    return workoutDays;
  };

  // Plano de fallback estático
  const generateFallbackPlan = (): WorkoutDay[] => {
    const intensity = getIntensityLevel(userRegistration.activity_level || '');
    const isGym = userRegistration.training_preference?.includes('academia') || false;
    const params = getWorkoutParams(intensity);

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
      duration: `${params.duration} minutos`,
      warmup: [
        'Mobilidade articular - 5 minutos',
        'Alongamento dinâmico - 5 minutos'
      ],
      exercises: staticExercises.slice(0, params.exercisesPerDay),
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

  // Gerar plano principal
  const generateWorkoutPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Se usuário não quer treinar
      if (userRegistration.training_preference === 'Não') {
        console.log('ℹ️ Usuário optou por não incluir treinos');
        setWorkoutPlan([]);
        return;
      }

      const intensity = getIntensityLevel(userRegistration.activity_level || '');
      const objective = mapGoalToObjective(userRegistration.goal);
      const isGym = userRegistration.training_preference?.includes('academia') || false;

      console.log('🚀 Iniciando geração inteligente:', { 
        intensidade: intensity, 
        objetivo: objective, 
        academia: isGym 
      });

      // Buscar exercícios do banco
      const exercises = await fetchExercisesFromDatabase(objective, intensity, isGym);
      
      // Gerar plano inteligente
      const plan = generateIntelligentWorkoutPlan(exercises, intensity);
      setWorkoutPlan(plan);
      
      console.log('✅ Plano inteligente gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao gerar plano:', error);
      setError('Erro ao gerar plano de treino');
      
      // Usar plano de fallback
      console.log('🔄 Gerando plano de fallback...');
      const fallbackPlan = generateFallbackPlan();
      setWorkoutPlan(fallbackPlan);
      console.log('✅ Plano de fallback gerado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateWorkoutPlan();
  }, [userRegistration]);

  const handleRetry = () => {
    console.log('🔄 Tentativa manual de regenerar plano...');
    setError(null);
    generateWorkoutPlan();
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

  // Se usuário não quer treinar
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