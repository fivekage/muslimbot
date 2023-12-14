FROM node:latest

# Create the directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and Install our bot
COPY package.json /usr/src/bot
RUN npm install

# Our precious bot
COPY . /usr/src/bot

# Start me!
CMD ["node", "index.js"]

# reference: https://github.com/nomsi/docker-discordjs-tutorial/blob/master/3.%20Creating%20the%20Dockerfile%20and%20Running!.md