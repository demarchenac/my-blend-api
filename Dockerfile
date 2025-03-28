# Playwright image: https://playwright.dev/docs/docker
FROM mcr.microsoft.com/playwright:v1.51.1-noble

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./

RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
