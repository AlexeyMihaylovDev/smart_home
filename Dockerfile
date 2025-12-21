FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Create data directory
RUN mkdir -p server/data

# Exposure port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start command
CMD ["node", "server/index.js"]
