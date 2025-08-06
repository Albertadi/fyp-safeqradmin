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

// Delete model (file + metadata)
export async function deleteMLModel(model_id: string): Promise<void> {
  // 1. fetch the storage_path from your table
  const { data: model, error: fetchError } = await supabase
    .from('ml_models')
    .select('storage_path')
    .eq('model_id', model_id)
    .single();

  if (fetchError || !model?.storage_path) {
    throw new Error(fetchError?.message || 'Model not found');
  }

  let filePath = model.storage_path as string;
  // if storage_path is a full URL, pull out the path relative to your bucket:
  //
  // e.g. "https://xyz.supabase.co/storage/v1/object/public/models/foo/bar.onnx"
  //      → we want "foo/bar.onnx"
  try {
    const url = new URL(filePath);
    // find the segment after "public/models/"
    const parts = url.pathname.split('/storage/v1/object/public/models/');
    if (parts.length === 2) {
      filePath = parts[1];
    }
  } catch {
    // not a URL, assume it's already the correct bucket path
  }

  // 2. delete the file from Storage
  const { data: removeData, error: removeError } = await supabase
    .storage
    .from('models') 
    .remove([filePath]);

  if (removeError) {
    throw new Error(removeError.message);
  }
  if (!removeData || removeData.length === 0) {
    console.warn('No file was actually removed. Check that filePath is correct.');
  }

  // 3. delete the DB row
  const { error: deleteError } = await supabase
    .from('ml_models')
    .delete()
    .eq('model_id', model_id);

  if (deleteError) {
    throw new Error(deleteError.message);
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