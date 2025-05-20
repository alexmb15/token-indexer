FROM node:18-alpine
WORKDIR /app

# copy the Yarn lock file
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY tsconfig.json .
COPY src ./src
RUN yarn build

CMD ["node", "dist/index.js"]
