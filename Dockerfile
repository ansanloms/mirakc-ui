FROM --platform=linux/amd64 docker.io/denoland/deno:2.6.10 AS build

WORKDIR /app

COPY . .
RUN deno install
RUN deno task build

FROM docker.io/denoland/deno:2.6.10

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

COPY . .
RUN deno install
COPY --from=build /app/_fresh ./_fresh
RUN deno cache _fresh/server.js

EXPOSE 8000

CMD ["serve", "-A", "_fresh/server.js"]
