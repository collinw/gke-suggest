FROM node:0.10.33

# Leaf dependencies.
RUN npm install jayson
RUN npm install line-reader
RUN npm install minimist

ADD data.json data.json
ADD leaf.js leaf.js

EXPOSE 9000

CMD node leaf.js --port=9000 --data_file=data.json