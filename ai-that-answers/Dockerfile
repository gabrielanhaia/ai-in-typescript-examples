# Node 24.18.0 "Krypton" is the pinned Active LTS (docs/versions.md). The tag
# node:24-bookworm-slim tracks the 24.x line; the exact patch a build resolves to
# is printed by `docker compose run ai-that-answers --version`.
FROM node:24-bookworm-slim

WORKDIR /app

# Copy the manifest and lockfile first so a source edit does not invalidate the
# install layer. npm ci installs exactly what is pinned, nothing newer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `docker compose run ai-that-answers ch03` appends "ch03" to this entrypoint.
ENTRYPOINT ["node", "--import", "tsx", "scripts/run.ts"]
CMD ["--list"]
