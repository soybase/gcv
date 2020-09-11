FROM node:14.3.0-alpine3.11 AS dev

# ensure "ng" in PATH
RUN npm install -g @angular/cli@8.3.19

WORKDIR /client

# install dependencies
COPY package.json .
COPY package-lock.json .

RUN apk add --no-cache git \
  && npm ci \
  && apk del git

COPY . .

ENTRYPOINT ["ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200

FROM dev AS builder

COPY . /client
ARG GCV_SUB_URI
RUN sed -i'' "s#http://localhost[:0-9]*/#${GCV_SUB_URI}#" src/config/config.json
RUN ng build --base-href "${GCV_SUB_URI}" --prod --build-optimizer

FROM nginx:1.19-alpine AS prod

COPY --from=builder /client/dist /usr/share/nginx/html
COPY nginx/ /etc/nginx/templates/
