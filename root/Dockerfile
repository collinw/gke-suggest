FROM node:0.10.33

# Root dependencies.
RUN npm install body-parser
RUN npm install consistent-hashing
RUN npm install express
RUN npm install jayson
RUN npm install minimist

ADD root.js root.js

EXPOSE 9000

CMD node root.js --port=9000