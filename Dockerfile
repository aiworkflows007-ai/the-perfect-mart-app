FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .
EXPOSE 5173
CMD ["npx", "serve", ".", "-l", "tcp://0.0.0.0:${PORT:-5173}"]
