FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
EXPOSE 6000
CMD ["node", "src/server.js"]
