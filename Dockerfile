FROM node:7.7.4-alpine
ADD . /code
WORKDIR /code
RUN npm install
ENTRYPOINT ["node","server.js"]
EXPOSE 1883
