const Promise = require('bluebird');
const express = require('express');
const http = require('http');
const {MongoClient} = require('mongodb');
const {ParseServer} = require('parse-server');

const mongoDBRunnerStart = require('mongodb-runner/mocha/before').bind({
  timeout() {
  },
  slow() {
  },
});
const mongoDBRunnerStop = require('mongodb-runner/mocha/after');

const startDB = () => (
  new Promise((done, reject) => {
    done.fail = reject;
    mongoDBRunnerStart(done);
  })
);

const stopDB = () => (
  new Promise((done, reject) => {
    done.fail = reject;
    mongoDBRunnerStop(done);
  })
);

const connectDB = (databaseURI) => new Promise((resolve, reject) => {
  MongoClient.connect(databaseURI, (err, db) => {
    if (err) {
      reject(err);
    } else {
      resolve(db);
    }
  });
});

let parseServerState = {};

const dropDB = () => {
  const {mongoConnection} = parseServerState;
  return mongoConnection.dropDatabaseAsync();
};

/**
 * Starts the ParseServer instance
 * @param {Object} parseServerOptions Used for creating the `ParseServer`
 * @return {Promise} Runner state
 */
function startParseServer(parseServerOptions = {}) {
  const mongodbPort = process.env.MONGODB_PORT || 27017;
  const {
    databaseName = 'parse-test',
    databaseURI = `mongodb://localhost:${mongodbPort}/${databaseName}`,
    masterKey = 'test',
    javascriptKey = 'test',
    appId = 'test',

    port = 30001,
    mountPath = '/1',
    serverURL = `http://localhost:${port}${mountPath}`,
  } = parseServerOptions;

  return startDB()
    .then(() => connectDB(databaseURI))
    .then((mongoConnection) => {
      parseServerOptions = Object.assign({
        masterKey, javascriptKey, appId,
        serverURL,
        databaseURI,
        silent: process.env.VERBOSE !== '1',
      }, parseServerOptions);
      const app = express();
      const parseServer = new ParseServer(parseServerOptions);

      app.use(mountPath, parseServer);

      const httpServer = http.createServer(app);

      Promise.promisifyAll(httpServer);
      Promise.promisifyAll(mongoConnection);

      return httpServer.listenAsync(port)
        .then(() => Object.assign(parseServerState, {
          parseServer,
          httpServer,
          mongoConnection,
          expressApp: app,
          parseServerOptions,
        }));
    });
}

/**
 * Stops the ParseServer instance
 * @return {Promise}
 */
function stopParseServer() {
  const {httpServer} = parseServerState;
  return httpServer.closeAsync()
    .then(stopDB)
    .then(() => parseServerState = {});
}

module.exports = {
  dropDB,
  startParseServer,
  stopParseServer,

  parseServerState,
};

