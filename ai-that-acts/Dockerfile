# Node 24.18.0 "Krypton" is the pinned Active LTS (../docs/versions.md). The tag
# node:24-bookworm-slim tracks the 24.x line.
#
# This image is the sample Braxby service, not a listing runner: the listings
# run on your own Node, because chapters 8 and 11 read from a terminal and
# spawn child processes.
FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8788
CMD ["node", "--import", "tsx", "app/server.ts"]
