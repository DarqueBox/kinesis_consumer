FROM instructure/node

RUN npm install aws-kcl
RUN apt-get install default-jre

COPY . /usr/src/app

ENTRYPOINT ["/usr/bin/node_modules/amazon-kinesis-client-nodejs/bin/kcl-bootstrap --java /usr/bin/java -e -p /usr/src/app/consumer/quiz_events.properties"]
