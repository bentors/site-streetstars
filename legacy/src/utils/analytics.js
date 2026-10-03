import ReactGA from "react-ga4";

const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID

let isInitialized = false;

export const initGA = () => {
  if (import.meta.env.DEV) {
    console.info('📊 Analytics: Modo Dev (Rastreamento desativado)');
    return;
  }

  if (isInitialized) {
    return;
  }

  if (!TRACKING_ID || !TRACKING_ID.startsWith("G-")) {
    console.warn('⚠️ Analytics: ID de rastreamento inválido ou ausente');
    return;
  }

  try {
    ReactGA.initialize(TRACKING_ID);
    isInitialized = true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Analytics:', error);
  }
};

export const logPageView = () => {
  if (!isInitialized) return;

  try {
    ReactGA.send({ 
      hitType: "pageview", 
      page: window.location.pathname + window.location.search 
    });
  } catch (error) {
    console.error('❌ Erro ao registrar pageview:', error);
  }
};

/**
 * Rastreia eventos personalizados (Botões, Interações, etc)
 * @param {string} category
 * @param {string} action
 * @param {string} label
 * @param {number} value
 */
export const logEvent = (category, action, label = null, value = null) => {
  if (!isInitialized) return;

  try {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  } catch (error) {
    console.error('❌ Erro ao registrar evento:', error);
  }
};

/**
 * Rastreia conversões de e-commerce (Venda Finalizada)
 * @param {object} transaction
 */
export const logPurchase = (transaction) => {
  if (!isInitialized) return;

  try {
    ReactGA.event('purchase', {
      transaction_id: transaction.id,
      value: transaction.value,
      currency: 'BRL',
      items: transaction.items
    });
  } catch (error) {
    console.error('❌ Erro ao registrar compra:', error);
  }
};