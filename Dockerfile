FROM node:16.14.0

RUN npm config set registry https://registry.npm.taobao.org

ENV HOME=/opt/app
ENV CONFIG_FILE="./config/config.yaml"

WORKDIR $HOME

COPY package.json $HOME
COPY yarn.lock $HOME
RUN yarn

COPY . $HOME
RUN yarn build

EXPOSE 3000

CMD ["node", "/opt/app/dist/main"]
