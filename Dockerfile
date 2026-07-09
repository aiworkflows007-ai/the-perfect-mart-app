FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
# Shell form so ${PORT} (provided by Railway) expands; serve binds to 0.0.0.0
CMD npx serve . -l tcp://0.0.0.0:${PORT:-3000}
