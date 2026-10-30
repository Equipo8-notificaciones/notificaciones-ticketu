FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node server.js ./server.js
ENV NODE_ENV=production PORT=10000
USER node
EXPOSE 10000
CMD ["node", "server.js"]
