/**
 * Otimiza URLs do Cloudinary com transformações automáticas.
 * @param {string} url
 * @param {number} width
 * @param {object} options
 * @returns {string}
 */
export const optimizeImage = (url, width = 800, options = {}) => {
  if (!url || typeof url !== 'string') {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23000" width="400" height="400"/%3E%3C/svg%3E';
  }

  if (!url.includes('cloudinary.com')) {
    return url;
  }

  try {
    const parts = url.split('/upload/');
    
    if (parts.length !== 2) {
      console.warn('URL Cloudinary inválida:', url);
      return url;
    }

    const transformations = [
      'f_auto',
      'q_auto:best',
      `w_${width}`,
      'c_limit',
      'dpr_auto',
    ];

    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);

    const transformation = transformations.join(',');

    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
    return url;
  }
}

/**
 * Gera srcset responsivo para Cloudinary
 * @param {string} url
 * @returns {string}
 */
export const generateSrcSet = (url) => {
  if (!url || !url.includes('cloudinary.com')) return '';

  const sizes = [400, 800, 1200, 1600];
  
  return sizes
    .map(size => `${optimizeImage(url, size)} ${size}w`)
    .join(', ');
}