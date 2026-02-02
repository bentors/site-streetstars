/**
 * Otimiza URLs do Cloudinary com transformações automáticas.
 * @param {string} url
 * @param {number} width
 * @param {object} options
 * @returns {string}
 */
export const optimizeImage = (url, width = 800, options = {}) => {
  if (!url || typeof url !== 'string') {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%230F0F0F" width="400" height="400"/%3E%3C/svg%3E';
  }

  if (!url.includes('cloudinary.com')) {
    return url;
  }

  try {
    const parts = url.split('/upload/');
    
    if (parts.length !== 2) {
      return url;
    }

    const transformations = [
      'f_auto',
      'c_limit',
      'dpr_auto',
      `w_${width}`,
    ];

    if (options.quality) {
        transformations.push(`q_${options.quality}`);
    } else {
        transformations.push('q_auto'); 
    }

    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);

    const transformationString = transformations.join(',');

    return `${parts[0]}/upload/${transformationString}/${parts[1]}`;
  } catch (error) {
    console.warn('Falha na otimização da imagem:', error);
    return url;
  }
}

/**
 * Gera srcset responsivo para Cloudinary
 * Útil para o atributo 'srcset' da tag <img>
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