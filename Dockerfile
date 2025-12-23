FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# Create data directory and ensure permissions
RUN mkdir -p data && chown -R node:node data

USER node

EXPOSE 3000

CMD ["node", "server.js"]
