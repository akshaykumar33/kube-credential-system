# # Vite Frontend Dockerfile
# FROM node:18-alpine AS builder

# WORKDIR /app/verification-app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Build with Vite
# RUN npm run build

# # Production stage with Nginx
# FROM nginx:alpine

# RUN rm /etc/nginx/conf.d/default.conf

# COPY --from=builder /app/verification-app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/nginx.conf
# COPY public/config.js /usr/share/nginx/html/config.js

# EXPOSE 80
# # CMD ["nginx", "-g", "daemon off;"]
# CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/config.js > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]

# Stage 1 – Build with Vite
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 – Serve with Nginx and inject env on start
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built files from builder stage
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/nginx.conf
# Copy startup env injection script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
