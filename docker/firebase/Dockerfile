# Emuladores do Firebase (Firestore + Auth + UI) sem exigir Java na máquina de quem desenvolve.
FROM node:24-trixie-slim

ARG FIREBASE_TOOLS_VERSION=15.32.1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-21-jre-headless curl \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g "firebase-tools@${FIREBASE_TOOLS_VERSION}" && npm cache clean --force

# Baixa os binários dos emuladores na imagem, para o container subir sem internet.
RUN firebase setup:emulators:firestore && firebase setup:emulators:ui

WORKDIR /workspace
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4000 8080 9099

HEALTHCHECK --interval=3s --timeout=3s --start-period=10s --retries=40 \
  CMD curl -fs http://127.0.0.1:8080/ >/dev/null && curl -fs http://127.0.0.1:9099/ >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
