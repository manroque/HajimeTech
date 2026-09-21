FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
