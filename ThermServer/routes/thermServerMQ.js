//var mqtt = require("mqtt");
var globaljs = require("./global");
var config = require("./config");
var httpUtils = require("./utils/httpUtils");
var thermManager = require("./thermManager");

/**
 *
 */
// exports.defineShelliesGenericTopic = function(mqClient) {
//   console.log("Define MQTopicShellies ..");
//   mqClient.subscribe(globaljs.MQTopicShellies, function(err) {
//     if (err)
//       console.error(
//         "Subscribe to topic " + globaljs.MQTopicShellies + " failed : " + err
//       );
//     else
//       console.log(
//         "Subscribe to topic " + globaljs.MQTopicShellies + " successfull"
//       );
//   });
// };

/**
 * Request Programming Topic
 */
// exports.defineProgrammingTopic = function(mqClient) {
//   console.log("Define ProgrammingTopic ..");
//   mqClient.subscribe(globaljs.MQTopicProgramming, function(err) {
//     if (err)
//       console.error(
//         "Subscribe to topic " + globaljs.MQTopicProgramming + " failed : " + err
//       );
//     else
//       console.log(
//         "Subscribe to topic " + globaljs.MQTopicProgramming + " successfull"
//       );
//   });
// };

// /**
//  * LastWill Topic
//  */
// exports.defineLastWillTopic = function(mqClient) {
//   console.log("Define LastWillTopic ..");
//   mqClient.subscribe(globaljs.MQTopicLastWill, function(err) {
//     if (err)
//       console.error(
//         "Subscribe to topic " + globaljs.MQTopicLastWill + " failed : " + err
//       );
//     else
//       console.log(
//         "Subscribe to topic " + globaljs.MQTopicLastWill + " successfull"
//       );
//   });
// };

/**
 * Monitor Topic
 */
exports.subscribeTopic = function(mqClient, topic) {
  //console.log("Define MonitorTopic ..");
  mqClient.subscribe(topic, function(err) {
    if (err) console.error("Subscribe to topic " + topic + " failed : " + err);
    else console.log("Subscribe to topic " + topic + " successfull");
  });
};

/**
 * Monitor Topic
 */
// exports.defineMonitorTopic = function(mqClient) {
//   console.log("Define MonitorTopic ..");
//   mqClient.subscribe(globaljs.MQTopicMonitor, function(err) {
//     if (err)
//       console.error(
//         "Subscribe to topic " + globaljs.MQTopicMonitor + " failed : " + err
//       );
//     else
//       console.log(
//         "Subscribe to topic " + globaljs.MQTopicMonitor + " successfull"
//       );
//   });
// };

/**
 * WiFi register Topic
 */
// exports.defineWifiRegisterTopic = function(mqClient) {
//   console.log("Define WifiRegisterTopic ..");
//   mqClient.subscribe(globaljs.MQTopicWifi, function(err) {
//     if (err)
//       console.error(
//         "Subscribe to topic " + globaljs.MQTopicWifi + " failed : " + err
//       );
//     else
//       console.log(
//         "Subscribe to topic " + globaljs.MQTopicWifi + " successfull"
//       );
//   });
// };

/**
 * manage Topic subscription
 */
exports.startMQListening = function(mqClient) {
  mqClient.on("message", function(topic, message) {
    console.log(
      "Message received from topic " + topic + " : message : " + message
    );
    try {
      if (topic === globaljs.MQTopicWifi) {
        let input = JSON.parse(message);
        var options = {
          request: input,
          macAddress: input.macAddress,
          callback: [],
          register: true,
          update: true
        };
        options.callback.push(wifiMQService);
        thermManager.wifiRegisterInternal(options);
      } else if (topic === globaljs.MQTopicProgramming) {
        let input = JSON.parse(message);
        var options = {
          programmingType: input.type,
          macAddress: input.macAddress,
          action: config.TypeAction.READ,
          callback: [],
          createIfNull: true
        };
        options.callback.push(programmingMQService);
        thermManager.manageProgramming(options);
      } else if (topic === globaljs.MQTopicMonitor) {
        var options = {
          request: JSON.parse(message),
          type: "MQ",
          callback: [],
          register: false
        };
        new Promise(function(resolve, reject) {
          thermManager.monitorSensorData(options, resolve, reject);
        })
          .then(function(options) {
            monitorMQService(options);
          })
          .catch(function(error) {
            console.log(
              "Error while processing message on topic " +
                globaljs.MQTopicMonitor +
                " : " +
                error
            );
          });
      } else if (topic === globaljs.MQTopicLastWill) {
        var options = {
          request: JSON.parse(message),
          type: "MQ",
          callback: [],
          register: false
        };
        options.callback.push(lastWillMQService);
        lastWillInternal(options);
      } else if (topic === globaljs.MQTopicMotion) {
        var options = {
          request: JSON.parse(message),
          type: "MQ",
          usePromise: true
        };
        new Promise(function(resolve, reject) {
          thermManager.processMotion(options, resolve, reject);
        })
          .then(function(options) {
            motionMQService(options);
          })
          .catch(function(error) {
            //
            console.log(
              "Error while processing message on topic " + topic + " : " + error
            );
          });
      } else if (topic.startsWith("shellies")) {
        console.log("Messaggio da SHELLY " + topic);
        var options = {
          request: message,
          type: "MQ",
          callback: [],
          topic: topic
        };
        new Promise(function(resolve, reject) {
          processShellyMessage(options, resolve, reject);
        })
          .then(function(options) {
            shellyMQService(options);
          })
          .catch(function(error) {
            //
            console.log(
              "Error while processing message on topic " + topic + " : " + error
            );
          });
      } else {
        console.log("Messaggio non gestito per topic " + topic);
      }
    } catch (error) {
      console.log(
        "Error while processing message on topic " + topic + " : " + error
      );
    }
  });
};

var processShellyMessage = function(options, resolve, reject) {
  let topic = options.topic.split("/");
  if (topic.length > 2) {
    let shellyId = topic[1];
    let command = topic[2];
    console.log("Shelly id : " + shellyId + " - command : " + command);
    if (command === "relay" && topic[topic.length - 1] === "0") {
      console.log("Current status of " + shellyId + " is " + options.request);
      options.shellyCommand = {
        command: config.TypeShellyCommand.RELAY,
        deviceid: shellyId
      };
      thermManager.monitorReleData(options, resolve, reject);
    }
  }
};

var programmingMQService = function(options) {
  if (options.response) {
    let prog = getCurrentProgrammingTemp(options.response);
    prog.configuration = options.configuration;
    options.response = prog;
    let msg = createGenericResponse(options);
    let topic = globaljs.MQTopicUpdateProgramming; // + "/" + options.macAddress;
    globaljs.mqttCli.publish(topic, JSON.stringify(msg));
  } else {
    console.error("Not able to send response .. ");
  }
};

/**
 * Return just current programming if any (type temperature)
 */
function getCurrentProgrammingTemp(conf) {
  var cconf = {};
  if (conf.activeProg >= 0) {
    cconf.currentTempProgram = conf.programming[conf.activeProg];
  }
  cconf.minTemp = conf.minTemp;
  cconf.minTempManual = conf.minTempManual;
  cconf.manualMode = conf.manualMode;
  cconf.active = conf.active;
  cconf.activeProg = conf.activeProg;
  return cconf;
}

/**
 * creaye JSON response
 */
var createGenericResponse = function(options) {
  var msg = {};
  if (options.error) {
    msg = httpUtils.createResponseKo(500, options.error);
  } else {
    if (options.response) msg = httpUtils.createResponse(options.response);
    else msg = httpUtils.createResponse(null, 100, "Record not Found");
  }
  return msg;
};

var sendProgrammingData = function(options) {
  let record = options.response;
  let configuration = {
    macAddress: record.macAddress,
    statusThermostat: record.statusThermostat,
    statusLight: record.statusLight,
    temperatureMeasure: record.temperatureMeasure,
    timeZoneOffset: new Date().getTimezoneOffset()
  };
  if (record.flagReleTemp) {
    console.log("Send Temperature configuration to " + record.macAddress);
    var optionsN = {
      programmingType: config.TypeProgramming.TEMP,
      configuration: configuration,
      action: config.TypeAction.READ,
      callback: [],
      createIfNull: true
    };
    optionsN.callback.push(programmingMQService);
    thermManager.manageProgramming(optionsN);
  }
  if (record.flagReleLight) {
    console.log("Send Ligth configuration to " + record.macAddress);
    var optionsN = {
      programmingType: config.TypeProgramming.LIGTH,
      configuration: configuration,
      action: config.TypeAction.READ,
      callback: [],
      createIfNull: true
    };
    optionsN.callback.push(programmingMQService);
    thermManager.manageProgramming(optionsN);
  }
  thermManager.callback(options);
};
/**
 * Activity to be done after wifi register
 * @param {*} options
 */
var wifiMQService = function(options) {
  console.log("Manage wifiMQService");
  //let res = options.response;
  sendProgrammingData(options);
};

var monitorMQService = function(options) {
  console.log("Manage monitorMQService");
};
var lastWillMQService = function(options) {
  console.log("Manage lastWillMQService");
};
var motionMQService = function(options) {
  console.log("Manage motionMQService");
};
var shellyMQService = function(options) {
  console.log("Manage shellyMQService");
};

var lastWillInternal = function(options) {};

exports.sendProgrammingData = sendProgrammingData;
