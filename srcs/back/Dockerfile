FROM node:lts-alpine AS backend-builder

LABEL maintainer="Maxime Bourand <mbourand@student.42.fr>"

WORKDIR /app
COPY ./nest-app-project/* ./
RUN mv prod_ormconfig.json ormconfig.json
RUN npm install
RUN npm run build


FROM node:lts-alpine AS backend-prod

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY --from=backend-builder /app ./
WORKDIR /app/dist
