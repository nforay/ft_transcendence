FROM node:lts-alpine as build-stage
EXPOSE 8080
WORKDIR /app
RUN npm i -g @vue/cli

#RUN mkdir dist

#FROM nginx:stable-alpine as production-stage
#COPY --from=build-stage /app/dist /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
