var express = require("express");
var globaljs = require("./ThermServer/routes/global");
var assert = require("assert");
var http = require("http");
var cors = require("cors");
var app = express();

var ep_app = require("./ThermServer/thermServer");
app.use("/therm", ep_app);

var guiServer = "http://localhost:8080";

var port = process.env.PORT || globaljs.SERVER_PORT;

app.set("port", port);


/**
 * Main
 * @param {*} httpDBMo
 */
function mainTask(httpDBMo) {
  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("Listening on " + bind);
  }
  // timepout funcion
  //setTimeout(refreshHTTPData, 5000, httpDBMo);
  // start http Listener
  app.use(
    cors()
  );
  var server = http.createServer(app).listen(app.get("port"));
  server.on("error", onError);
  server.on("listening", onListening);

  // Setup MQTT
  setupMQTT();
}

var connectFunc = function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to MongoDB server : " + globaljs.urlDB);
  globaljs.mongoCon = db.db(globaljs.DBName);
  mainTask(globaljs.mongoCon);
};

/**
 * Start Mongo DB client
 */
var connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Connect to DB
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://" + globaljs.urlDB;
MongoClient.connect(url, connectOptions, connectFunc);

/**
 * Start MQTT client
 */
function setupMQTT() {
  var mqtt = require("mqtt");
  var mqManager = require("./ThermServer/routes/thermServerMQ");
  var client = mqtt.connect(globaljs.urlMQTT, {
    will: {
      topic: globaljs.MQTopicLastWill,
      payload: '{ "macAddress" : "server"}'
    }
  });
  client.on("connect", function() {
    console.log("Connected successfully to MQTT server : " + globaljs.urlMQTT);
    globaljs.mqttCli = client;
    // call function to create topic
    // - update configuration ->
    // - collect monitor data <-
    // - update themperture if more then one thermostat ->
    // - wifiRegister <-
    mqManager.defineWifiRegisterTopic(client);
    mqManager.defineMonitorTopic(client);
    mqManager.defineLastWillTopic(client);
    mqManager.defineProgrammingTopic(client);
    mqManager.startMQListening(client);
  });
}
