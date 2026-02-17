# Dockerfile for UI Navigator frontend (React + Vite)

FROM node:22-slim AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:22-slim AS runtime

WORKDIR /app

RUN yarn global add serve

COPY --from=build /app/dist ./dist

ENV PORT=3000

CMD ["serve", "-s", "dist", "-l", "3000"]
