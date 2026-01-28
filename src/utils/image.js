/**
 * Otimiza URLs do Cloudinary automaticamente.
 * @param {string} url
 * @param {number} width
 * @returns {string}
 */
export const optimizeImage = (url, width = 800) => {
  if (!url) return '';

  if (!url.includes('cloudinary.com')) return url;

  const parts = url.split('/upload/');
  
  const transformation = `f_auto,q_auto,w_${width}`;

  return `${parts[0]}/upload/${transformation}/${parts[1]}`;
}