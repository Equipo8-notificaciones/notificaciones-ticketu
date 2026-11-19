FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY app.js ./app.js
COPY src ./src
COPY tests ./tests
COPY supabase ./supabase

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "app.js"]
