# FROM node:18-alpine
# WORKDIR /app/services/issuance-service
# RUN mkdir -p data logs
# COPY package*.json ./
# COPY tsconfig.json ./
# RUN npm install 
# COPY src ./src
# RUN npm run build
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nodejs -u 1001
# RUN chown -R nodejs:nodejs /app
# USER nodejs
# EXPOSE 3000
# CMD ["npm", "start"]

FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Install all deps including devDependencies so tsc is available
RUN npm install

COPY src ./src

# Build TS → JS
RUN npm run build


# ================== Production image ==================
FROM node:18-alpine AS prod
WORKDIR /app

# Copy only compiled dist + production deps
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
