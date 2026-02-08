FROM node:18-alpine
ARG CC_SERVER_PORT
ENV PORT=$CC_SERVER_PORT
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CC_SERVER_PORT}
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE ${CC_SERVER_PORT}
CMD [ "npm", "start" ]
