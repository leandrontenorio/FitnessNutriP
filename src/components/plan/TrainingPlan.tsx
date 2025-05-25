import React from 'react';
import { Dumbbell, Clock } from 'lucide-react';

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

function TrainingPlan({ userRegistration, isPrintMode = false }: TrainingPlanProps) {
  const workoutDays = [
    {
      day: 'Dia 1 - Treino A',
      exercises: [
        { name: 'Agachamento', sets: '4', reps: '12', rest: '60s' },
        { name: 'Supino Reto', sets: '4', reps: '12', rest: '60s' },
        { name: 'Remada Curvada', sets: '4', reps: '12', rest: '60s' },
        { name: 'Elevação Lateral', sets: '3', reps: '15', rest: '45s' },
        { name: 'Extensão de Tríceps na Polia', sets: '3', reps: '15', rest: '45s' }
      ]
    },
    {
      day: 'Dia 2 - Treino B',
      exercises: [
        { name: 'Leg Press', sets: '4', reps: '12', rest: '60s' },
        { name: 'Puxada na Frente', sets: '4', reps: '12', rest: '60s' },
        { name: 'Desenvolvimento com Halter', sets: '4', reps: '12', rest: '60s' },
        { name: 'Rosca Direta', sets: '3', reps: '15', rest: '45s' },
        { name: 'Extensão de Quadríceps', sets: '3', reps: '15', rest: '45s' }
      ]
    },
    {
      day: 'Dia 3 - Treino C',
      exercises: [
        { name: 'Stiff', sets: '4', reps: '12', rest: '60s' },
        { name: 'Supino Inclinado', sets: '4', reps: '12', rest: '60s' },
        { name: 'Remada Alta', sets: '4', reps: '12', rest: '60s' },
        { name: 'Extensão de Tríceps Corda', sets: '3', reps: '15', rest: '45s' },
        { name: 'Panturrilha em Pé', sets: '3', reps: '20', rest: '45s' }
      ]
    }
  ];

  const warmupExercises = [
    { name: 'Mobilidade Articular', duration: '3 minutos' },
    { name: 'Caminhada Leve', duration: '5 minutos' },
    { name: 'Alongamento Dinâmico', duration: '5 minutos' }
  ];

  const cooldownExercises = [
    { name: 'Alongamento Estático', duration: '5 minutos' },
    { name: 'Respiração Profunda', duration: '2 minutos' }
  ];

  return (
    <div className="space-y-8">
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

      {/* Aquecimento */}
      <div className="warmup-section bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-[#6a1b9a] mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Aquecimento
        </h3>
        <div className="space-y-4">
          {warmupExercises.map((exercise, index) => (
            <div key={index} className="flex justify-between items-center bg-purple-50 p-4 rounded-lg">
              <span className="text-gray-700">{exercise.name}</span>
              <span className="text-[#6a1b9a] font-medium">{exercise.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Treinos */}
      <div className="exercise-section space-y-8">
        {workoutDays.map((day, dayIndex) => (
          <div key={dayIndex} className="workout-day bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-[#6a1b9a] mb-6">{day.day}</h3>
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
        ))}
      </div>

      {/* Volta à Calma */}
      <div className="cooldown-section bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-[#6a1b9a] mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Volta à Calma
        </h3>
        <div className="space-y-4">
          {cooldownExercises.map((exercise, index) => (
            <div key={index} className="flex justify-between items-center bg-purple-50 p-4 rounded-lg">
              <span className="text-gray-700">{exercise.name}</span>
              <span className="text-[#6a1b9a] font-medium">{exercise.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dicas e Observações */}
      <div className="tips-section bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-[#6a1b9a] mb-4">Dicas Importantes</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Mantenha uma respiração controlada durante os exercícios</li>
          <li>Beba água regularmente durante o treino</li>
          <li>Mantenha a forma correta dos exercícios</li>
          <li>Ajuste as cargas conforme necessário</li>
          <li>Descanse adequadamente entre as séries</li>
        </ul>
      </div>
    </div>
  );
}

export default TrainingPlan;