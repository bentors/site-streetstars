const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadCache = new Map();

export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado.' };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use JPG, PNG ou WebP.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo: 5MB.' };
  }

  return { valid: true, error: null };
};

// Busca assinatura temporária do servidor — API_SECRET nunca toca o cliente
async function getUploadSignature() {
  const res = await fetch('/api/signUpload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Falha ao obter assinatura de upload');
  return res.json(); // { timestamp, signature, api_key }
}

export const uploadImageToCloudinary = async (file, options = {}) => {
  if (!file) return null;

  const { valid, error } = validateImageFile(file);
  if (!valid) throw new Error(error);

  const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

  if (uploadCache.has(fileKey)) {
    return uploadCache.get(fileKey);
  }

  const uploadPromise = (async () => {
    try {
      // Obtém assinatura do servidor
      const { timestamp, signature, api_key } = await getUploadSignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', api_key);

      if (options.quality) formData.append('quality', options.quality);
      if (options.format) formData.append('format', options.format);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData, signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const data = await response.json();

      setTimeout(() => uploadCache.delete(fileKey), 300000);

      return data.secure_url;
    } catch (error) {
      uploadCache.delete(fileKey);
      throw error;
    }
  })();

  uploadCache.set(fileKey, uploadPromise);
  return uploadPromise;
};