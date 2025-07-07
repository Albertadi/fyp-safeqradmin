import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export type MLModel = {
  model_id: string;
  version: string;
  storage_path?: string;
  trained_by?: string;
  created_at: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  params?: any;
  train_time_seconds?: number;
  is_active?: boolean;
};


// Fetch all models
export async function fetchMLModels(): Promise<MLModel[]> {
const { data, error } = await supabase
.from('ml_models')
.select('*')
.order('created_at', { ascending: false });

if (error) {
console.error('Failed to fetch models:', error);
throw new Error(error.message);
}

return data || [];
}

// Create a new model entry (e.g., when training starts)
export async function createMLModel(model: Partial<MLModel>): Promise<void> {
const { error } = await supabase.from('ml_models').insert([model]);

if (error) {
console.error('Failed to create model:', error);
throw new Error(error.message);
}
}

// Delete model
export async function deleteMLModel(model_id: string): Promise<void> {
const { error } = await supabase.from('ml_models').delete().eq('model_id', model_id);

if (error) {
console.error('Failed to delete model:', error);
throw new Error(error.message);
}
}

// Update model status or metrics
export async function updateMLModel(model_id: string, updates: Partial<MLModel>): Promise<void> {
const { error } = await supabase.from('ml_models').update(updates).eq('model_id', model_id);

if (error) {
console.error('Failed to update model:', error);
throw new Error(error.message);
}
}