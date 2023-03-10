FROM node:16.4
WORKDIR /app
COPY package.json /app
RUN npm install --production --legacy-peer-deps
COPY . /app
RUN npm run build
CMD npm run start
EXPOSE 8081
