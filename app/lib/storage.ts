import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadFile = async (
  file: File,
  path?: string
): Promise<string> => {

  if (!file) {
    throw new Error('File is required');
  }

  if (!path || typeof path !== 'string') {
    throw new Error('Invalid storage path');
  }

  const cleanPath = path.trim();

  if (!cleanPath) {
    throw new Error('Empty storage path');
  }

  const fileRef = ref(storage, cleanPath);

  await uploadBytes(fileRef, file);

  return await getDownloadURL(fileRef);
};