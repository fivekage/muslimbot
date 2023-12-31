FROM node:slim as builder


WORKDIR /usr/src/bot
COPY package.json .
RUN npm install --production
RUN npm install -g @vercel/ncc
COPY . .

RUN ncc build index.js -o dist


FROM node:alpine
WORKDIR /usr/src/bot
COPY --from=builder /usr/src/bot/dist/index.js .
CMD ["index.js"]


# reference: https://webbylab.com/blog/minimal_size_docker_image_for_your_nodejs_app/