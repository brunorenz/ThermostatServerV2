// override console.lg
var myutils = require("./ThermServer/routes/utils/myutils");
var timers = require("./ThermServer/routes/timersManager");

console.log = (function() {
  var orig = console.log;
  return function() {
    try {
      myutils.log.apply(console, arguments);
    } catch {
      orig.apply(console, arguments);
    }
  };
})();

var express = require("express");
var globaljs = require("./ThermServer/routes/global");
var assert = require("assert");
var http = require("http");
//var cors = require("cors");
var app = express();

var ep_app = require("./ThermServer/thermServer");
app.use("/therm", ep_app);

var guiServer = "http://localhost:8080";

var port = process.env.PORT || globaljs.SERVER_PORT;

app.set("port", port);

/**
 * Start Mongo DB client
 */
var connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

function setupJ5() {
  const { EtherPortClient } = require("etherport-client");
  const five = require("johnny-five");
  const board = new five.Board({
    port: new EtherPortClient({
      host: "192.168.0.106",
      port: 3030
    }),
    repl: false
  });
  board.on("ready", () => {
    var multi = new five.Multi({
      controller: "BME280"
    });
    var lcd = new five.LCD({
      controller: "PCF8574",
      rows: 4,
      cols: 20,
      backlight: 13
    });
    multi.on("data", function() {
      console.log("Thermometer");
      console.log("  celsius      : ", this.thermometer.celsius);
      console.log("  fahrenheit   : ", this.thermometer.fahrenheit);
      console.log("  kelvin       : ", this.thermometer.kelvin);
      console.log("--------------------------------------");

      console.log("Barometer");
      console.log("  pressure     : ", this.barometer.pressure);
      console.log("--------------------------------------");

      console.log("Hygrometer");
      console.log("  humidity     : ", this.hygrometer.relativeHumidity);
      console.log("--------------------------------------");

      console.log("Altimeter");
      console.log("  feet         : ", this.altimeter.feet);
      console.log("  meters       : ", this.altimeter.meters);
      console.log("--------------------------------------");
    });
  });
}
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
    mqManager.subscribeTopic(client, globaljs.MQTopicLastWill);
    mqManager.subscribeTopic(client, globaljs.MQTopicWifi);
    mqManager.subscribeTopic(client, globaljs.MQTopicProgramming);
    mqManager.subscribeTopic(client, globaljs.MQTopicShellies);
    mqManager.subscribeTopic(client, globaljs.MQTopicMonitor);
    mqManager.subscribeTopic(client, globaljs.MQTopicMotion);
    mqManager.startMQListening(client);
  });
}

function setupHTTP() {
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
  //app.use(cors());
  var server = http.createServer(app).listen(app.get("port"));
  server.on("error", onError);
  server.on("listening", onListening);
}

function setupTimer() {
  setTimeout(timers.checkTemperature, 5000);
}

/**
 * MAIN
 */

var connectFunc = function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to MongoDB server : " + globaljs.urlDB);
  globaljs.mongoCon = db.db(globaljs.DBName);
  mainTask(globaljs.mongoCon);
};

/**
 * Main
 * @param {*} httpDBMo
 */
function mainTask(httpDBMo) {
  // Setup HTTP
  console.log("Setup HTTP Listener");
  setupHTTP();

  // Setup MQTT
  console.log("Setup MQTT Server");
  setupMQTT();

  console.log("Setup TimeOut service");
  setupTimer();
  //setupJ5();
  //findShelly();
}

// Connect to DB
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://" + globaljs.urlDB;
MongoClient.connect(url, connectOptions, connectFunc);
