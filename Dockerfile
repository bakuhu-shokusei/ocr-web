# for build
FROM node:22-alpine AS build

WORKDIR /ocr-web/client
COPY ./client/package.json ./client/package-lock.json ./
RUN npm install

WORKDIR /ocr-web/server
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install

WORKDIR /ocr-web/client
COPY client/. .
RUN npm run build

WORKDIR /ocr-web/server
COPY server/. .
RUN npm run build

# for production
FROM node:22-alpine

WORKDIR /ocr-web/client
COPY --from=build /ocr-web/client/dist ./dist

WORKDIR /ocr-web/server
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install --only=production
COPY --from=build /ocr-web/server/dist ./dist

ENTRYPOINT ["node", "./dist/index.js"]
