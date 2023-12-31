FROM node:slim as builder


WORKDIR /usr/src/bot
COPY . .
RUN npm install --production
RUN npm install -g @zeit/ncc
RUN ncc build app.js -o dist


FROM node:slim
WORKDIR /usr/src/bot
COPY --from=builder /app/dist/index.js .
CMD ["node", "index.js"]


# reference: https://webbylab.com/blog/minimal_size_docker_image_for_your_nodejs_app/