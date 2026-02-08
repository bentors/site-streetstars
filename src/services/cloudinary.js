  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 

  const uploadCache = new Map();

  export const uploadImageToCloudinary = async (file, options = {}) => {
    if (!file) return null;

    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (uploadCache.has(fileKey)) {
      return uploadCache.get(fileKey);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    if (options.quality) {
      formData.append("quality", options.quality);
    }
    if (options.format) {
      formData.append("format", options.format);
    }

    const uploadPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();

        setTimeout(() => {
          uploadCache.delete(fileKey);
        }, 300000);
        
        return data.secure_url;
      } catch (error) {
        console.error("Erro ao subir imagem:", error);
        uploadCache.delete(fileKey);
        return null;
      }
    })();

    uploadCache.set(fileKey, uploadPromise);
    return uploadPromise;
  };