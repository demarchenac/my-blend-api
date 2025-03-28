# Use Node.js 22 with Alpine for a lightweight image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Install dependencies required for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/*

# Copy package files and install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm install

# Copy source code
COPY src ./src

# Build the TypeScript app
RUN npm run build

# Set Puppeteer environment variable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose the app's port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
