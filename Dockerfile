FROM node:24.14-alpine3.23 AS node
WORKDIR /usr/src/bot
COPY . /usr/src/bot
RUN npm install --ignore-scripts


FROM alpine:3.23

USER root

COPY --from=node /usr/src/bot  /usr/src/bot
WORKDIR  /usr/src/bot

RUN apk update && apk add --no-cache ffmpeg

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

CMD ["node", "index.js"]