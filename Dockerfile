FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# We need legacy-peer-deps because of React 19 / related dependency conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Prune dev dependencies to keep image smaller
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]
