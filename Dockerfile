# Usa la imagen oficial de Playwright con Node.js 22 basada en Ubuntu Noble
FROM mcr.microsoft.com/playwright:v1.51.1-noble

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero para mejorar el cacheo
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente después de instalar dependencias
COPY . .

# Instalar los navegadores de Playwright
RUN npx playwright install --with-deps

# Compilar TypeScript
RUN npm run build

# Definir el comando de inicio
CMD ["node", "dist/server.js"]
