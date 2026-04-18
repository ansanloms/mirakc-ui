FROM --platform=$BUILDPLATFORM docker.io/denoland/deno:2.7.8 AS mirakc-ui-build

WORKDIR /app

COPY . .
RUN deno install
RUN deno task build

FROM docker.io/denoland/deno:2.7.8

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

COPY . .
RUN deno install
COPY --from=mirakc-ui-build /app/_fresh ./_fresh
RUN deno cache _fresh/server.js

EXPOSE 8000

CMD ["serve", "-A", "_fresh/server.js"]
