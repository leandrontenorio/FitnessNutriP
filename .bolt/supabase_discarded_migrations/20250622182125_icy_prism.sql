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
      - `objetivos` (text) - objectives
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
  nome text NOT NULL,
  grupo_muscular text NOT NULL,
  equipamento text NOT NULL,
  series integer NOT NULL DEFAULT 3,
  repeticoes text NOT NULL DEFAULT '10-12',
  descanso text NOT NULL DEFAULT '60s',
  nivel text NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  objetivos text NOT NULL,
  observacoes text,
  gif_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
INSERT INTO exercises (nome, grupo_muscular, equipamento, series, repeticoes, descanso, nivel, objetivos, observacoes, gif_url) VALUES

-- PEITO - Iniciante
('Flexão de Braço', 'Peito', 'Peso Corporal', 3, '8-12', '60s', 'iniciante', 'emagrecimento, definicao, ganho_massa', 'Mantenha o corpo alinhado, desça até o peito quase tocar o chão', 'https://example.com/flexao.gif'),
('Supino com Halteres', 'Peito', 'Halteres', 3, '10-12', '90s', 'iniciante', 'ganho_massa, definicao', 'Controle o movimento, não trave os cotovelos completamente', 'https://example.com/supino-halteres.gif'),
('Crucifixo com Halteres', 'Peito', 'Halteres', 3, '12-15', '60s', 'iniciante', 'definicao, ganho_massa', 'Movimento amplo, sinta o alongamento do peitoral', 'https://example.com/crucifixo.gif'),

-- PEITO - Intermediário
('Supino Reto com Barra', 'Peito', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa, definicao', 'Pegada na largura dos ombros, controle total do movimento', 'https://example.com/supino-barra.gif'),
('Supino Inclinado', 'Peito', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa, definicao', 'Inclinação de 30-45 graus, foque na parte superior do peitoral', 'https://example.com/supino-inclinado.gif'),
('Paralelas', 'Peito', 'Peso Corporal', 3, '8-12', '90s', 'intermediario', 'ganho_massa, definicao', 'Incline o corpo para frente para focar no peitoral', 'https://example.com/paralelas.gif'),

-- PEITO - Avançado
('Supino Declinado', 'Peito', 'Barra', 4, '6-8', '120s', 'avancado', 'ganho_massa, definicao', 'Foque na parte inferior do peitoral, movimento controlado', 'https://example.com/supino-declinado.gif'),
('Crossover', 'Peito', 'Cabo', 4, '12-15', '60s', 'avancado', 'definicao, ganho_massa', 'Movimento de arco, contração máxima no final', 'https://example.com/crossover.gif'),

-- COSTAS - Iniciante
('Puxada na Frente', 'Costas', 'Máquina', 3, '10-12', '90s', 'iniciante', 'ganho_massa, definicao', 'Puxe até a altura do peito, aperte as escápulas', 'https://example.com/puxada-frente.gif'),
('Remada Curvada com Halteres', 'Costas', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa, definicao', 'Mantenha as costas retas, puxe o cotovelo para trás', 'https://example.com/remada-halteres.gif'),
('Remada Sentada', 'Costas', 'Cabo', 3, '12-15', '60s', 'iniciante', 'definicao, ganho_massa', 'Aperte as escápulas, mantenha o peito estufado', 'https://example.com/remada-sentada.gif'),

-- COSTAS - Intermediário
('Barra Fixa', 'Costas', 'Peso Corporal', 3, '6-10', '120s', 'intermediario', 'ganho_massa, definicao', 'Se necessário, use assistência. Foque na amplitude completa', 'https://example.com/barra-fixa.gif'),
('Remada Curvada com Barra', 'Costas', 'Barra', 4, '8-10', '90s', 'intermediario', 'ganho_massa, definicao', 'Pegada pronada, puxe a barra até o abdômen', 'https://example.com/remada-barra.gif'),
('Puxada Triangular', 'Costas', 'Cabo', 3, '10-12', '60s', 'intermediario', 'ganho_massa, definicao', 'Pegada neutra, foque no latíssimo', 'https://example.com/puxada-triangular.gif'),

-- COSTAS - Avançado
('Levantamento Terra', 'Costas', 'Barra', 4, '5-6', '180s', 'avancado', 'ganho_massa, definicao', 'Movimento complexo, mantenha as costas neutras', 'https://example.com/levantamento-terra.gif'),
('Remada T-Bar', 'Costas', 'Barra', 4, '8-10', '90s', 'avancado', 'ganho_massa, definicao', 'Pegada neutra, puxe até o peito', 'https://example.com/remada-tbar.gif'),

-- PERNAS - Iniciante
('Agachamento Livre', 'Pernas', 'Peso Corporal', 3, '12-15', '60s', 'iniciante', 'emagrecimento, definicao, ganho_massa', 'Desça até 90 graus, mantenha os joelhos alinhados', 'https://example.com/agachamento.gif'),
('Leg Press', 'Pernas', 'Máquina', 3, '12-15', '90s', 'iniciante', 'ganho_massa, definicao', 'Pés na largura dos ombros, desça controladamente', 'https://example.com/leg-press.gif'),
('Extensão de Pernas', 'Pernas', 'Máquina', 3, '12-15', '45s', 'iniciante', 'definicao, ganho_massa', 'Movimento controlado, contração no topo', 'https://example.com/extensao-pernas.gif'),
('Flexão de Pernas', 'Pernas', 'Máquina', 3, '12-15', '45s', 'iniciante', 'definicao, ganho_massa', 'Foque nos isquiotibiais, movimento controlado', 'https://example.com/flexao-pernas.gif'),

-- PERNAS - Intermediário
('Agachamento com Barra', 'Pernas', 'Barra', 4, '8-12', '120s', 'intermediario', 'ganho_massa, definicao', 'Barra nas costas, desça até paralelo ao chão', 'https://example.com/agachamento-barra.gif'),
('Avanço com Halteres', 'Pernas', 'Halteres', 3, '10-12', '60s', 'intermediario', 'definicao, ganho_massa', 'Passo largo, desça o joelho até quase tocar o chão', 'https://example.com/avanco.gif'),
('Stiff com Halteres', 'Pernas', 'Halteres', 3, '10-12', '90s', 'intermediario', 'ganho_massa, definicao', 'Pernas semi-flexionadas, desça até sentir alongar', 'https://example.com/stiff.gif'),
('Panturrilha em Pé', 'Pernas', 'Máquina', 4, '15-20', '45s', 'intermediario', 'definicao, ganho_massa', 'Amplitude completa, contração no topo', 'https://example.com/panturrilha.gif'),

-- PERNAS - Avançado
('Agachamento Frontal', 'Pernas', 'Barra', 4, '6-8', '150s', 'avancado', 'ganho_massa, definicao', 'Barra na frente, maior ativação do quadríceps', 'https://example.com/agachamento-frontal.gif'),
('Agachamento Búlgaro', 'Pernas', 'Halteres', 3, '10-12', '60s', 'avancado', 'definicao, ganho_massa', 'Pé traseiro elevado, foque na perna da frente', 'https://example.com/agachamento-bulgaro.gif'),

-- OMBROS - Iniciante
('Desenvolvimento com Halteres', 'Ombros', 'Halteres', 3, '10-12', '90s', 'iniciante', 'ganho_massa, definicao', 'Movimento vertical, não trave os cotovelos', 'https://example.com/desenvolvimento.gif'),
('Elevação Lateral', 'Ombros', 'Halteres', 3, '12-15', '45s', 'iniciante', 'definicao, ganho_massa', 'Braços ligeiramente flexionados, eleve até a altura dos ombros', 'https://example.com/elevacao-lateral.gif'),
('Elevação Frontal', 'Ombros', 'Halteres', 3, '12-15', '45s', 'iniciante', 'definicao, ganho_massa', 'Movimento controlado, eleve até a altura dos ombros', 'https://example.com/elevacao-frontal.gif'),

-- OMBROS - Intermediário
('Desenvolvimento Militar', 'Ombros', 'Barra', 4, '8-10', '120s', 'intermediario', 'ganho_massa, definicao', 'Em pé, barra da altura do peito até acima da cabeça', 'https://example.com/desenvolvimento-militar.gif'),
('Elevação Posterior', 'Ombros', 'Halteres', 3, '12-15', '45s', 'intermediario', 'definicao, ganho_massa', 'Inclinado, eleve os braços para trás', 'https://example.com/elevacao-posterior.gif'),
('Encolhimento', 'Ombros', 'Halteres', 3, '12-15', '60s', 'intermediario', 'ganho_massa, definicao', 'Eleve os ombros, contraia o trapézio', 'https://example.com/encolhimento.gif'),

-- OMBROS - Avançado
('Arnold Press', 'Ombros', 'Halteres', 4, '8-10', '90s', 'avancado', 'ganho_massa, definicao', 'Rotação dos punhos durante o movimento', 'https://example.com/arnold-press.gif'),
('Desenvolvimento Atrás da Nuca', 'Ombros', 'Barra', 3, '8-10', '120s', 'avancado', 'ganho_massa, definicao', 'Cuidado com a amplitude, não force demais', 'https://example.com/desenvolvimento-nuca.gif'),

-- BRAÇOS - Iniciante
('Rosca Direta', 'Braços', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa, definicao', 'Cotovelos fixos, movimento apenas do antebraço', 'https://example.com/rosca-direta.gif'),
('Tríceps Testa', 'Braços', 'Halteres', 3, '10-12', '60s', 'iniciante', 'ganho_massa, definicao', 'Cotovelos fixos, desça até a testa', 'https://example.com/triceps-testa.gif'),
('Rosca Martelo', 'Braços', 'Halteres', 3, '10-12', '45s', 'iniciante', 'ganho_massa, definicao', 'Pegada neutra, movimento controlado', 'https://example.com/rosca-martelo.gif'),

-- BRAÇOS - Intermediário
('Rosca Barra', 'Braços', 'Barra', 3, '8-10', '90s', 'intermediario', 'ganho_massa, definicao', 'Pegada na largura dos ombros, movimento completo', 'https://example.com/rosca-barra.gif'),
('Tríceps Pulley', 'Braços', 'Cabo', 3, '10-12', '45s', 'intermediario', 'ganho_massa, definicao', 'Cotovelos colados ao corpo, extensão completa', 'https://example.com/triceps-pulley.gif'),
('Rosca Concentrada', 'Braços', 'Halteres', 3, '10-12', '45s', 'intermediario', 'definicao, ganho_massa', 'Apoie o cotovelo na coxa, movimento isolado', 'https://example.com/rosca-concentrada.gif'),

-- BRAÇOS - Avançado
('Rosca 21', 'Braços', 'Barra', 3, '21', '90s', 'avancado', 'ganho_massa, definicao', '7 reps parciais baixo, 7 alto, 7 completas', 'https://example.com/rosca-21.gif'),
('Tríceps Francês', 'Braços', 'Barra', 3, '8-10', '90s', 'avancado', 'ganho_massa, definicao', 'Deitado, desça a barra atrás da cabeça', 'https://example.com/triceps-frances.gif'),

-- ABDÔMEN - Iniciante
('Abdominal Tradicional', 'Abdômen', 'Peso Corporal', 3, '15-20', '30s', 'iniciante', 'emagrecimento, definicao', 'Mãos atrás da cabeça, suba apenas o tronco', 'https://example.com/abdominal.gif'),
('Prancha', 'Abdômen', 'Peso Corporal', 3, '30-60s', '30s', 'iniciante', 'emagrecimento, definicao', 'Corpo alinhado, contraia o abdômen', 'https://example.com/prancha.gif'),
('Elevação de Pernas', 'Abdômen', 'Peso Corporal', 3, '12-15', '30s', 'iniciante', 'definicao, emagrecimento', 'Deitado, eleve as pernas até 90 graus', 'https://example.com/elevacao-pernas.gif'),

-- ABDÔMEN - Intermediário
('Abdominal Bicicleta', 'Abdômen', 'Peso Corporal', 3, '20-30', '30s', 'intermediario', 'emagrecimento, definicao', 'Movimento de pedalada, toque cotovelo no joelho oposto', 'https://example.com/abdominal-bicicleta.gif'),
('Prancha Lateral', 'Abdômen', 'Peso Corporal', 3, '30-45s', '30s', 'intermediario', 'definicao, emagrecimento', 'Apoio lateral, corpo alinhado', 'https://example.com/prancha-lateral.gif'),
('Russian Twist', 'Abdômen', 'Peso Corporal', 3, '20-30', '30s', 'intermediario', 'definicao, emagrecimento', 'Sentado, gire o tronco de um lado para outro', 'https://example.com/russian-twist.gif'),

-- ABDÔMEN - Avançado
('Abdominal com Peso', 'Abdômen', 'Halteres', 3, '12-15', '45s', 'avancado', 'ganho_massa, definicao', 'Segure peso no peito, movimento controlado', 'https://example.com/abdominal-peso.gif'),
('Prancha com Elevação', 'Abdômen', 'Peso Corporal', 3, '10-15', '30s', 'avancado', 'definicao, ganho_massa', 'Na prancha, eleve alternadamente braços e pernas', 'https://example.com/prancha-elevacao.gif'),

-- CARDIO - Todos os níveis
('Esteira', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'iniciante', 'emagrecimento, definicao', 'Mantenha ritmo constante, monitore frequência cardíaca', 'https://example.com/esteira.gif'),
('Bicicleta Ergométrica', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'iniciante', 'emagrecimento, definicao', 'Ajuste resistência conforme condicionamento', 'https://example.com/bicicleta.gif'),
('Elíptico', 'Cardio', 'Máquina', 1, '20-30min', '0s', 'intermediario', 'emagrecimento, definicao', 'Movimento completo de braços e pernas', 'https://example.com/eliptico.gif'),
('HIIT', 'Cardio', 'Peso Corporal', 1, '15-20min', '0s', 'avancado', 'emagrecimento, definicao', 'Alta intensidade com intervalos de descanso', 'https://example.com/hiit.gif'),

-- EXERCÍCIOS FUNCIONAIS - Iniciante
('Burpee', 'Funcional', 'Peso Corporal', 3, '8-12', '60s', 'iniciante', 'emagrecimento, definicao', 'Movimento completo: agachamento, prancha, salto', 'https://example.com/burpee.gif'),
('Mountain Climber', 'Funcional', 'Peso Corporal', 3, '20-30', '45s', 'iniciante', 'emagrecimento, definicao', 'Na prancha, alterne joelhos ao peito rapidamente', 'https://example.com/mountain-climber.gif'),
('Jumping Jack', 'Funcional', 'Peso Corporal', 3, '20-30', '30s', 'iniciante', 'emagrecimento, definicao', 'Salte abrindo pernas e braços simultaneamente', 'https://example.com/jumping-jack.gif'),

-- EXERCÍCIOS FUNCIONAIS - Intermediário
('Kettlebell Swing', 'Funcional', 'Kettlebell', 3, '15-20', '60s', 'intermediario', 'emagrecimento, ganho_massa', 'Movimento de quadril, kettlebell até altura dos ombros', 'https://example.com/kettlebell-swing.gif'),
('Box Jump', 'Funcional', 'Caixa', 3, '8-12', '90s', 'intermediario', 'ganho_massa, definicao', 'Salte na caixa, desça controladamente', 'https://example.com/box-jump.gif'),
('Battle Rope', 'Funcional', 'Corda', 3, '30s', '60s', 'intermediario', 'emagrecimento, definicao', 'Movimente as cordas vigorosamente', 'https://example.com/battle-rope.gif'),

-- EXERCÍCIOS FUNCIONAIS - Avançado
('Turkish Get Up', 'Funcional', 'Kettlebell', 3, '5-8', '90s', 'avancado', 'ganho_massa, definicao', 'Movimento complexo do chão até em pé', 'https://example.com/turkish-getup.gif'),
('Muscle Up', 'Funcional', 'Peso Corporal', 3, '3-5', '120s', 'avancado', 'ganho_massa, definicao', 'Barra fixa + paralela em um movimento', 'https://example.com/muscle-up.gif'),
('Pistol Squat', 'Funcional', 'Peso Corporal', 3, '5-8', '90s', 'avancado', 'ganho_massa, definicao', 'Agachamento em uma perna só', 'https://example.com/pistol-squat.gif');

-- Create updated_at trigger
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exercises_nivel ON exercises(nivel);
CREATE INDEX idx_exercises_grupo_muscular ON exercises(grupo_muscular);
CREATE INDEX idx_exercises_objetivos ON exercises USING gin(to_tsvector('portuguese', objetivos));