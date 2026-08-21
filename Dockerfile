# The recipe for this app's own image.
FROM node:22-alpine

WORKDIR /app

# Copy the dependency manifests first. Docker caches this layer, so it only
# reinstalls packages when package.json actually changes - not on every edit.
COPY package*.json ./
RUN npm ci --omit=dev

# Now the source code.
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
