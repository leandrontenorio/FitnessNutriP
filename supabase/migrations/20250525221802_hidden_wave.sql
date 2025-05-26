/*
  # Training Plans Schema

  1. New Tables
    - `training_plans`
      - Stores user's training program details
    - `workout_days`
      - Contains exercises for each training day
    - `exercise_logs`
      - Tracks exercise performance and progress

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_level text NOT NULL,
  training_preference text NOT NULL,
  frequency_per_week integer NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workout_days table
CREATE TABLE IF NOT EXISTS workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
  day_name text NOT NULL,
  exercises jsonb NOT NULL, -- Array of exercise objects with sets, reps, rest
  warmup jsonb NOT NULL,    -- Warmup routine
  cooldown jsonb NOT NULL,  -- Cooldown routine
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_day_id uuid REFERENCES workout_days(id) ON DELETE CASCADE NOT NULL,
  exercise_name text NOT NULL,
  sets_completed integer NOT NULL,
  reps_completed integer NOT NULL,
  weight decimal,
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for training_plans
CREATE POLICY "Users can read own training plans"
  ON training_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own training plans"
  ON training_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for workout_days
CREATE POLICY "Users can read own workout days"
  ON workout_days FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.plan_id
    AND training_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own workout days"
  ON workout_days FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.plan_id
    AND training_plans.user_id = auth.uid()
  ));

-- Create policies for exercise_logs
CREATE POLICY "Users can read own exercise logs"
  ON exercise_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own exercise logs"
  ON exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_days_updated_at
  BEFORE UPDATE ON workout_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_logs_updated_at
  BEFORE UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX idx_exercise_logs_user_id ON exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_workout_day_id ON exercise_logs(workout_day_id);