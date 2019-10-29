var mqtt = require("mqtt");
var globaljs = require("./global");
var thermManager = require("./thermManager");

/**
 * LastWill Topic
 */
exports.defineLastWillTopic = function(mqClient) {
  console.log("Define LastWillTopic ..");
  mqClient.subscribe(globaljs.MQTopicLastWill, function(err) {
    if (err)
      console.error(
        "Subscribe to topic " + globaljs.MQTopicLastWill + " failed : " + err
      );
    else
      console.log(
        "Subscribe to topic " + globaljs.MQTopicLastWill + " successfull"
      );
  });
};

/**
 * Monitor Topic
 */
exports.defineMonitorTopic = function(mqClient) {
  console.log("Define MonitorTopic ..");
  mqClient.subscribe(globaljs.MQTopicMonitor, function(err) {
    if (err)
      console.error(
        "Subscribe to topic " + globaljs.MQTopicMonitor + " failed : " + err
      );
    else
      console.log(
        "Subscribe to topic " + globaljs.MQTopicMonitor + " successfull"
      );
  });
};

/**
 * WiFi register Topic
 */
exports.defineWifiRegisterTopic = function(mqClient) {
  console.log("Define WifiRegisterTopic ..");
  mqClient.subscribe(globaljs.MQTopicWifi, function(err) {
    if (err)
      console.error(
        "Subscribe to topic " + globaljs.MQTopicWifi + " failed : " + err
      );
    else
      console.log(
        "Subscribe to topic " + globaljs.MQTopicWifi + " successfull"
      );
  });
};

/**
 * manage Topic subscription
 */
exports.startMQListening = function(mqClient) {
  mqClient.on("message", function(topic, message) {
    console.log("Message received from topic " + topic);
    if (topic === globaljs.MQTopicWifi) {
      console.log("Manage WiFi Register message : " + message);
      let input = JSON.parse(message);
      var options = {
        inputMessage: input,
        macAddress: input.macAddress,
        register: true
      };
      options.callback = wifiMQService;
      thermManager.wifiRegisterInternal(options);
    } else if (topic === globaljs.MQTopicMonitor) {
      console.log("Manage Monitor message : " + message);
      var options = {
        inputMessage: JSON.parse(message),
        type: "MQ",
        register: false
      };
      options.callback = monitorMQService;
      thermManager.monitorInternal(options);
    } else if (topic === globaljs.MQTopicLastWill) {
      console.log("Manage LastWill message : " + message);
      var options = {
        inputMessage: JSON.parse(message),
        type: "MQ",
        register: false
      };
      options.callback = lastWillMQService;
      lastWillInternal(options);
    }
  });
};

/**
 * Activity to be done after
 * @param {*} options
 */
var wifiMQService = function(options) {
  console.log("Manage wifiMQService");
  //globaljs.mqClient.p;
  // send update configuration
};

var monitorMQService = function(options) {
  console.log("Manage monitorMQService");
  // send update configuration
};
var lastWillMQService = function(options) {
  console.log("Manage lastWillMQService");
  // send update configuration
};

var lastWillInternal = function(options) {};
