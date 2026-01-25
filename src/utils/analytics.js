import ReactGA from "react-ga4";

const TRACKING_ID = "G-T1BDGRFTP7";

export const initGA = () => {
  if (TRACKING_ID && TRACKING_ID.startsWith("G-")) {
    try {
      ReactGA.initialize(TRACKING_ID);
      console.log("GA INICIALIZADO");
    } catch (error) {
      console.error("Erro ao iniciar GA:", error);
    }
  } else {
    console.warn("GA não inicializado: ID inválido ou ausente");
  }
};

export const logPageView = () => {
  if (TRACKING_ID) {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }
};