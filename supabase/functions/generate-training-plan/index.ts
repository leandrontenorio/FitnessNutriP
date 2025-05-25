import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  userId: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
  activity_level: string;
  training_preference: string;
  frequency_per_week: number;
  restrictions?: string[];
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Missing Gemini API key');
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get user data from request
    const userData: UserData = await req.json();

    // Generate prompt
    const prompt = `As an expert personal trainer and exercise physiologist, create a detailed workout plan based on these parameters:

Weight: ${userData.weight}kg
Height: ${userData.height}cm
Age: ${userData.age}
Gender: ${userData.gender}
Goal: ${userData.goal}
Activity Level: ${userData.activity_level}
Training Preference: ${userData.training_preference}
Frequency: ${userData.frequency_per_week} days per week
${userData.restrictions ? `Restrictions: ${userData.restrictions.join(', ')}` : ''}

Return ONLY a JSON object with this exact structure (no other text):
{
  "workoutDays": [
    {
      "day": "string (e.g., 'Day 1: Upper Body')",
      "warmup": [{ "name": "string", "duration": "string" }],
      "exercises": [
        {
          "name": "string",
          "sets": "string",
          "reps": "string",
          "rest": "string",
          "notes": ["string"]
        }
      ],
      "cooldown": [{ "name": "string", "duration": "string" }]
    }
  ]
}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const workoutPlan = JSON.parse(response.text());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save training plan to database
    const { data: trainingPlan, error: planError } = await supabase
      .from('training_plans')
      .insert([{
        user_id: userData.userId,
        activity_level: userData.activity_level,
        training_preference: userData.training_preference,
        frequency_per_week: userData.frequency_per_week
      }])
      .select()
      .single();

    if (planError) throw planError;

    // Save workout days
    const workoutDaysData = workoutPlan.workoutDays.map((day: any) => ({
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

    return new Response(
      JSON.stringify({ success: true, data: workoutPlan }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        fallback: true 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});