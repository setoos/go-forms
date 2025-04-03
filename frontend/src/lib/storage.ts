import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from './toast';

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param path The storage path (bucket/folder)
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, path: string = 'template-images'): Promise<string> {
  // Generate a unique filename to prevent collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `public/${fileName}`;
  
  // Upload the file
  const { data, error } = await supabase.storage
    .from(path)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: publicURL } = supabase.storage
    .from(path)
    .getPublicUrl(filePath);
  
  if (!publicURL) throw new Error('Failed to get public URL');
  
  return publicURL.publicUrl;
}

/**
 * Validates an image before upload
 * @param file The file to validate
 * @returns True if valid, throws error if invalid
 */
export function validateImage(file: File): boolean {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG, or GIF images.');
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image is too large. Maximum size is 5MB.');
  }
  
  return true;
}

/**
 * Handles image upload with validation and error handling
 */
export async function handleImageUpload(onSuccess: (url: string) => void): Promise<void> {
  // Create a file input element
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/jpeg, image/png, image/gif');
  
  // When a file is selected
  input.onchange = async () => {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    try {
      // Validate the file
      validateImage(file);
      
      // Show loading toast
      showToast('Uploading image...', 'info');
      
      // Upload to Supabase Storage
      const imageUrl = await uploadImage(file);
      
      // Call success callback with the URL
      onSuccess(imageUrl);
      
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Error uploading image: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };
  
  // Trigger file selection
  input.click();
}