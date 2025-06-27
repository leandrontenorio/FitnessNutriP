/*
  # Create exercises table with sample data

  1. New Tables
    - `exercises`
      - `id` (integer, primary key, auto-increment)
      - `nome` (text) - exercise name
      - `grupo_muscular` (text) - muscle group
      - `equipamento` (text) - equipment type
      - `series` (integer) - number of sets
      - `repeticoes` (text) - repetitions (e.g., "10-12")
      - `descanso` (text) - rest time (e.g., "60s")
      - `nivel` (text) - difficulty level
      - `objective` (text) - objectives
      - `observacoes` (text) - instructions/notes
      - `gif_url` (text) - image/gif URL

  2. Security
    - Enable RLS on `exercises` table
    - Add policy for authenticated users to read exercises

  3. Sample Data
    - Insert comprehensive exercise data for different levels and objectives
*/

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  nome text,
  grupo_muscular text,
  academia text,
  series integer,
  repeticoes text,
  descanso text,
  nivel text,
  objective text,
  observacoes text,
  gif_url text,
  equipamento text
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policy for reading exercises
CREATE POLICY "Users can read exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for public access (since exercises are reference data)
CREATE POLICY "Public can read exercises"
  ON exercises FOR SELECT
  TO anon
  USING (true);

-- Insert sample exercise data
INSERT INTO exercises (nome, grupo_muscular, equipamento, series, repeticoes, descanso, nivel, objective, observacoes, gif_url) VALUES

-- PEITO - Iniciante
('Flexão de Braço', 'Peito', 'Peso Corporal', 3, '8-12', '60s', 'iniciante', 'emagrecimento', 'Mantenha o corpo alinhado, desça até o peito quase tocar o chão', 'https://example.com/flexao.gif'),
('Supino com Halteres', 'Peito', 'Halteres', 3, '10-12', '90s', 'iniciante', 'ganho_massa', 'Controle o movimento, não trave os cotovelos completamente', 'https://example.com/supino-halteres.gif'),
('Crucifixo com Halteres', 'Peito', 'Halteres', 3, '12-15', '60s', 'iniciante', 'definicao', 'Movimento amplo, sinta o alongamento do peitoral', 'https://example.com/crucifixo.gif'),

-- PEITO - Intermediário
('Supino Reto com Barra', 'Peito', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa', 'Pegada na largura dos ombros, controle total do movimento', 'https://example.com/supino-barra.gif'),
('Supino Inclinado', 'Peito', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa', 'Inclinação de 30-45 graus, foque na parte superior do peitoral', 'https://example.com/supino-inclinado.gif'),
('Paralelas', 'Peito', 'Peso Corporal', 3, '8-12', '90s', 'intermediario', 'ganho_massa', 'Incline o corpo para frente para focar no peitoral', 'https://example.com/paralelas.gif'),

-- PEITO - Avançado
('Supino Declinado', 'Peito', 'Barra', 4, '6-8', '120s', 'avancado', 'ganho_massa', 'Foque na parte inferior do peitoral, movimento controlado', 'https://example.com/supino-declinado.gif'),
('Crossover', 'Peito', 'Cabo', 4, '12-15', '60s', 'avancado', 'definicao', 'Movimento de arco, contração máxima no final', 'https://example.com/crossover.gif'),

-- COSTAS - Iniciante
('Puxada na Frente', 'Costas', 'Máquina', 3, '10-12', '90s', 'iniciante', 'ganho_massa', 'Puxe até a altura do peito, aperte as escápulas', 'https://example.com/puxada-frente.gif'),
('Remada Curvada com Halteres', 'Costas', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa', 'Mantenha as costas retas, puxe o cotovelo para trás', 'https://example.com/remada-halteres.gif'),
('Remada Sentada', 'Costas', 'Cabo', 3, '12-15', '60s', 'iniciante', 'definicao', 'Aperte as escápulas, mantenha o peito estufado', 'https://example.com/remada-sentada.gif'),

-- COSTAS - Intermediário
('Barra Fixa', 'Costas', 'Peso Corporal', 3, '6-10', '120s', 'intermediario', 'ganho_massa', 'Se necessário, use assistência. Foque na amplitude completa', 'https://example.com/barra-fixa.gif'),
('Remada Curvada com Barra', 'Costas', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa', 'Pegada pronada, puxe a barra até o abdômen', 'https://example.com/remada-barra.gif'),
('Puxada Triangular', 'Costas', 'Cabo', 3, '10-12', '60s', 'intermediario', 'ganho_massa', 'Pegada neutra, foque no latíssimo', 'https://example.com/puxada-triangular.gif'),

-- COSTAS - Avançado
('Levantamento Terra', 'Costas', 'Barra', 4, '5-6', '180s', 'avancado', 'ganho_massa', 'Movimento complexo, mantenha as costas neutras', 'https://example.com/levantamento-terra.gif'),
('Remada T-Bar', 'Costas', 'Barra', 4, '8-10', '90s', 'avancado', 'ganho_massa', 'Pegada neutra, puxe até o peito', 'https://example.com/remada-tbar.gif'),

-- PERNAS - Iniciante
('Agachamento Livre', 'Pernas', 'Peso Corporal', 3, '12-15', '60s', 'iniciante', 'emagrecimento', 'Desça até 90 graus, mantenha os joelhos alinhados', 'https://example.com/agachamento.gif'),
('Leg Press', 'Pernas', 'Máquina', 3, '12-15', '90s', 'iniciante', 'ganho_massa', 'Pés na largura dos ombros, desça controladamente', 'https://example.com/leg-press.gif'),
('Extensão de Pernas', 'Pernas', 'Máquina', 3, '12-15', '45s', 'iniciante', 'definicao', 'Movimento controlado, contração no topo', 'https://example.com/extensao-pernas.gif'),
('Flexão de Pernas', 'Pernas', 'Máquina', 3, '12-15', '45s', 'iniciante', 'definicao', 'Foque nos isquiotibiais, movimento controlado', 'https://example.com/flexao-pernas.gif'),

-- PERNAS - Intermediário
('Agachamento com Barra', 'Pernas', 'Barra', 4, '8-12', '120s', 'intermediario', 'ganho_massa', 'Barra nas costas, desça até paralelo ao chão', 'https://example.com/agachamento-barra.gif'),
('Avanço com Halteres', 'Pernas', 'Halteres', 3, '10-12', '60s', 'intermediario', 'definicao', 'Passo largo, desça o joelho até quase tocar o chão', 'https://example.com/avanco.gif'),
('Stiff com Halteres', 'Pernas', 'Halteres', 3, '10-12', '90s', 'intermediario', 'ganho_massa', 'Pernas semi-flexionadas, desça até sentir alongar', 'https://example.com/stiff.gif'),
('Panturrilha em Pé', 'Pernas', 'Máquina', 4, '15-20', '45s', 'intermediario', 'definicao', 'Amplitude completa, contração no topo', 'https://example.com/panturrilha.gif'),

-- PERNAS - Avançado
('Agachamento Frontal', 'Pernas', 'Barra', 4, '6-8', '150s', 'avancado', 'ganho_massa', 'Barra na frente, maior ativação do quadríceps', 'https://example.com/agachamento-frontal.gif'),
('Agachamento Búlgaro', 'Pernas', 'Halteres', 3, '10-12', '60s', 'avancado', 'definicao', 'Pé traseiro elevado, foque na perna da frente', 'https://example.com/agachamento-bulgaro.gif'),

-- OMBROS - Iniciante
('Desenvolvimento com Halteres', 'Ombros', 'Halteres', 3, '10-12', '90s', 'iniciante', 'ganho_massa', 'Movimento vertical, não trave os cotovelos', 'https://example.com/desenvolvimento.gif'),
('Elevação Lateral', 'Ombros', 'Halteres', 3, '12-15', '45s', 'iniciante', 'definicao', 'Braços ligeiramente flexionados, eleve até a altura dos ombros', 'https://example.com/elevacao-lateral.gif'),
('Elevação Frontal', 'Ombros', 'Halteres', 3, '12-15', '45s', 'iniciante', 'definicao', 'Movimento controlado, eleve até a altura dos ombros', 'https://example.com/elevacao-frontal.gif'),

-- OMBROS - Intermediário
('Desenvolvimento Militar', 'Ombros', 'Barra', 4, '8-10', '120s', 'intermediario', 'ganho_massa', 'Em pé, barra da altura do peito até acima da cabeça', 'https://example.com/desenvolvimento-militar.gif'),
('Elevação Posterior', 'Ombros', 'Halteres', 3, '12-15', '45s', 'intermediario', 'definicao', 'Inclinado, eleve os braços para trás', 'https://example.com/elevacao-posterior.gif'),
('Encolhimento', 'Ombros', 'Halteres', 3, '12-15', '60s', 'intermediario', 'ganho_massa', 'Eleve os ombros, contraia o trapézio', 'https://example.com/encolhimento.gif'),

-- OMBROS - Avançado
('Arnold Press', 'Ombros', 'Halteres', 4, '8-10', '90s', 'avancado', 'ganho_massa', 'Rotação dos punhos durante o movimento', 'https://example.com/arnold-press.gif'),
('Desenvolvimento Atrás da Nuca', 'Ombros', 'Barra', 3, '8-10', '120s', 'avancado', 'ganho_massa', 'Cuidado com a amplitude, não force demais', 'https://example.com/desenvolvimento-nuca.gif'),

-- BRAÇOS - Iniciante
('Rosca Direta', 'Bíceps', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa', 'Cotovelos fixos, movimento apenas do antebraço', 'https://example.com/rosca-direta.gif'),
('Tríceps Testa', 'Tríceps', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa', 'Cotovelos fixos, desça até a testa', 'https://example.com/triceps-testa.gif'),
('Rosca Martelo', 'Bíceps', 'Halteres', 3, '10-12', '45s', 'iniciante', 'ganho_massa', 'Pegada neutra, movimento controlado', 'https://example.com/rosca-martelo.gif'),

-- BRAÇOS - Intermediário
('Rosca Barra', 'Bíceps', 'Barra', 3, '8-10', '90s', 'intermediario', 'ganho_massa', 'Pegada na largura dos ombros, movimento completo', 'https://example.com/rosca-barra.gif'),
('Tríceps Pulley', 'Tríceps', 'Cabo', 3, '10-12', '45s', 'intermediario', 'ganho_massa', 'Cotovelos colados ao corpo, extensão completa', 'https://example.com/triceps-pulley.gif'),
('Rosca Concentrada', 'Bíceps', 'Halteres', 3, '10-12', '45s', 'intermediario', 'definicao', 'Apoie o cotovelo na coxa, movimento isolado', 'https://example.com/rosca-concentrada.gif'),

-- BRAÇOS - Avançado
('Rosca 21', 'Bíceps', 'Barra', 3, '21', '90s', 'avancado', 'ganho_massa', '7 reps parciais baixo, 7 alto, 7 completas', 'https://example.com/rosca-21.gif'),
('Tríceps Francês', 'Tríceps', 'Barra', 3, '8-10', '90s', 'avancado', 'ganho_massa', 'Deitado, desça a barra atrás da cabeça', 'https://example.com/triceps-frances.gif'),

-- ABDÔMEN - Iniciante
('Abdominal Tradicional', 'Abdômen', 'Peso Corporal', 3, '15-20', '30s', 'iniciante', 'emagrecimento', 'Mãos atrás da cabeça, suba apenas o tronco', 'https://example.com/abdominal.gif'),
('Prancha', 'Abdômen', 'Peso Corporal', 3, '30-60s', '30s', 'iniciante', 'emagrecimento', 'Corpo alinhado, contraia o abdômen', 'https://example.com/prancha.gif'),
('Elevação de Pernas', 'Abdômen', 'Peso Corporal', 3, '12-15', '30s', 'iniciante', 'definicao', 'Deitado, eleve as pernas até 90 graus', 'https://example.com/elevacao-pernas.gif'),

-- ABDÔMEN - Intermediário
('Abdominal Bicicleta', 'Abdômen', 'Peso Corporal', 3, '20-30', '30s', 'intermediario', 'emagrecimento', 'Movimento de pedalada, toque cotovelo no joelho oposto', 'https://example.com/abdominal-bicicleta.gif'),
('Prancha Lateral', 'Abdômen', 'Peso Corporal', 3, '30-45s', '30s', 'intermediario', 'definicao', 'Apoio lateral, corpo alinhado', 'https://example.com/prancha-lateral.gif'),
('Russian Twist', 'Abdômen', 'Peso Corporal', 3, '20-30', '30s', 'intermediario', 'definicao', 'Sentado, gire o tronco de um lado para outro', 'https://example.com/russian-twist.gif'),

-- ABDÔMEN - Avançado
('Abdominal com Peso', 'Abdômen', 'Halteres', 3, '12-15', '45s', 'avancado', 'ganho_massa', 'Segure peso no peito, movimento controlado', 'https://example.com/abdominal-peso.gif'),
('Prancha com Elevação', 'Abdômen', 'Peso Corporal', 3, '10-15', '30s', 'avancado', 'definicao', 'Na prancha, eleve alternadamente braços e pernas', 'https://example.com/prancha-elevacao.gif'),

-- CARDIO - Todos os níveis
('Esteira', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'iniciante', 'emagrecimento', 'Mantenha ritmo constante, monitore frequência cardíaca', 'https://example.com/esteira.gif'),
('Bicicleta Ergométrica', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'iniciante', 'emagrecimento', 'Ajuste resistência conforme condicionamento', 'https://example.com/bicicleta.gif'),
('Elíptico', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'intermediario', 'emagrecimento', 'Movimento completo de braços e pernas', 'https://example.com/eliptico.gif'),
('HIIT', 'Cardio', 'Peso Corporal', 1, '15-20min', '0s', 'avancado', 'emagrecimento', 'Alta intensidade com intervalos de descanso', 'https://example.com/hiit.gif'),

-- EXERCÍCIOS FUNCIONAIS - Iniciante
('Burpee', 'Funcional', 'Peso Corporal', 3, '8-12', '60s', 'iniciante', 'emagrecimento', 'Movimento completo: agachamento, prancha, salto', 'https://example.com/burpee.gif'),
('Mountain Climber', 'Funcional', 'Peso Corporal', 3, '20-30', '45s', 'iniciante', 'emagrecimento', 'Na prancha, alterne joelhos ao peito rapidamente', 'https://example.com/mountain-climber.gif'),
('Jumping Jack', 'Funcional', 'Peso Corporal', 3, '20-30', '30s', 'iniciante', 'emagrecimento', 'Salte abrindo pernas e braços simultaneamente', 'https://example.com/jumping-jack.gif'),

-- EXERCÍCIOS FUNCIONAIS - Intermediário
('Kettlebell Swing', 'Funcional', 'Kettlebell', 3, '15-20', '60s', 'intermediario', 'emagrecimento', 'Movimento de quadril, kettlebell até altura dos ombros', 'https://example.com/kettlebell-swing.gif'),
('Box Jump', 'Funcional', 'Caixa', 3, '8-12', '90s', 'intermediario', 'ganho_massa', 'Salte na caixa, desça controladamente', 'https://example.com/box-jump.gif'),
('Battle Rope', 'Funcional', 'Corda', 3, '30s', '60s', 'intermediario', 'emagrecimento', 'Movimente as cordas vigorosamente', 'https://example.com/battle-rope.gif'),

-- EXERCÍCIOS FUNCIONAIS - Avançado
('Turkish Get Up', 'Funcional', 'Kettlebell', 3, '5-8', '90s', 'avancado', 'ganho_massa', 'Movimento complexo do chão até em pé', 'https://example.com/turkish-getup.gif'),
('Muscle Up', 'Funcional', 'Peso Corporal', 3, '3-5', '120s', 'avancado', 'ganho_massa', 'Barra fixa + paralela em um movimento', 'https://example.com/muscle-up.gif'),
('Pistol Squat', 'Funcional', 'Peso Corporal', 3, '5-8', '90s', 'avancado', 'ganho_massa', 'Agachamento em uma perna só', 'https://example.com/pistol-squat.gif'),

-- Glúteos - Iniciante
('Agachamento Sumo', 'Glúteos', 'Peso Corporal', 3, '12-15', '60s', 'iniciante', 'definicao', 'Pés mais afastados, pontas dos pés para fora', 'https://example.com/agachamento-sumo.gif'),
('Ponte de Glúteo', 'Glúteos', 'Peso Corporal', 3, '15-20', '45s', 'iniciante', 'definicao', 'Deitado, eleve o quadril contraindo o glúteo', 'https://example.com/ponte-gluteo.gif'),
('Elevação de Quadril', 'Glúteos', 'Peso Corporal', 3, '12-15', '45s', 'iniciante', 'definicao', 'De quatro, eleve uma perna para trás', 'https://example.com/elevacao-quadril.gif'),

-- Glúteos - Intermediário
('Agachamento com Salto', 'Glúteos', 'Peso Corporal', 3, '10-12', '60s', 'intermediario', 'emagrecimento', 'Agachamento explosivo com salto', 'https://example.com/agachamento-salto.gif'),
('Ponte com Peso', 'Glúteos', 'Halteres', 3, '12-15', '60s', 'intermediario', 'ganho_massa', 'Ponte com halter sobre o quadril', 'https://example.com/ponte-peso.gif'),
('Passada Lateral', 'Glúteos', 'Peso Corporal', 3, '10-12', '45s', 'intermediario', 'definicao', 'Passo lateral amplo, agache de um lado', 'https://example.com/passada-lateral.gif'),

-- Glúteos - Avançado
('Hip Thrust', 'Glúteos', 'Barra', 4, '8-12', '90s', 'avancado', 'ganho_massa', 'Costas apoiadas no banco, barra sobre o quadril', 'https://example.com/hip-thrust.gif'),
('Agachamento Pistola', 'Glúteos', 'Peso Corporal', 3, '5-8', '90s', 'avancado', 'ganho_massa', 'Agachamento em uma perna só', 'https://example.com/agachamento-pistola.gif');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_nivel ON exercises(nivel);
CREATE INDEX IF NOT EXISTS idx_exercises_grupo_muscular ON exercises(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_exercises_objective ON exercises(objective);
CREATE INDEX IF NOT EXISTS idx_exercises_equipamento ON exercises(equipamento);