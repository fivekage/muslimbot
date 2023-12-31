FROM node:20-bullseye-slim AS build
WORKDIR /usr/src/bot
COPY . /usr/src/bot
RUN npm install

FROM gcr.io/distroless/nodejs20-debian11
COPY --from=build /usr/src/bot  /usr/src/bot
WORKDIR  /usr/src/bot
CMD ["index.js"]

# Reference https://snyk.io/fr/blog/choosing-the-best-node-js-docker-image/