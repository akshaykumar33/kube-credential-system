FROM node:18-alpine
WORKDIR /app/services/issuance-service
RUN mkdir -p data logs
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["npm", "start"]