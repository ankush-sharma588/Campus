# Vite 7 requires Node.js 20.19+; Node 22 is used for a consistent build.
FROM node:22.23.5-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Vite variables are embedded at build time. /api is used only in Docker,
# where nginx forwards /api/* to the backend container.
ARG VITE_BACKEND_URL=/api
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
