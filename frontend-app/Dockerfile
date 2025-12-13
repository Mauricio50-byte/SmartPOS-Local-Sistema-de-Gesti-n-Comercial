FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8100
CMD ["sh","-c","npm run start -- --host 0.0.0.0 --port 8100"]
