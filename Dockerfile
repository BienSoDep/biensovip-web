# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_* env is baked into the build at build time (Vite reads env at build, not runtime)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GA4_MEASUREMENT_ID
ENV VITE_GA4_MEASUREMENT_ID=$VITE_GA4_MEASUREMENT_ID
ARG VITE_GA4_PROPERTY_ID
ENV VITE_GA4_PROPERTY_ID=$VITE_GA4_PROPERTY_ID

RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
