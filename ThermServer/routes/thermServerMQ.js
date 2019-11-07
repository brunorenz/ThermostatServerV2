var mqtt = require("mqtt");
var globaljs = require("./global");
var httpUtils = require("./utils/httpUtils");
var thermManager = require("./thermManager");

/**
 * Request Programming Topic
 */
exports.defineProgrammingTopic = function(mqClient) {
  console.log("Define ProgrammingTopic ..");
  mqClient.subscribe(globaljs.MQTopicProgramming, function(err) {
    if (err)
      console.error(
        "Subscribe to topic " + globaljs.MQTopicProgramming + " failed : " + err
      );
    else
      console.log(
        "Subscribe to topic " + globaljs.MQTopicProgramming + " successfull"
      );
  });
};

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
    console.log(
      "Message received from topic " + topic + " : message : " + message
    );
    if (topic === globaljs.MQTopicWifi) {
      let input = JSON.parse(message);
      var options = {
        request: input,
        macAddress: input.macAddress,
        register: true,
        update: true
      };
      options.callback = wifiMQService;
      thermManager.wifiRegisterInternal(options);
    } else if (topic === globaljs.MQTopicProgramming) {
      let input = JSON.parse(message);
      var options = {
        programmingType: input.type,
        macAddress: input.macAddress,
        action: thermManager.TypeAction.READ,
        createIfNull: true
      };
      options.callback = programmingMQService;
      thermManager.programmingInternal(options);
    } else if (topic === globaljs.MQTopicMonitor) {
      var options = {
        request: JSON.parse(message),
        type: "MQ",
        register: false
      };
      options.callback = monitorMQService;
      thermManager.monitorInternal(options);
    } else if (topic === globaljs.MQTopicLastWill) {
      var options = {
        request: JSON.parse(message),
        type: "MQ",
        register: false
      };
      options.callback = lastWillMQService;
      lastWillInternal(options);
    }
  });
};

var programmingMQService = function(options) {
  if (options.macAddress) {
    let msg = createGenericResponse(options);
    let topic = globaljs.MQTopicUpdateProgramming + "/" + options.macAddress;
    globaljs.mqttCli.publish(topic, JSON.stringify(msg));
  } else {
    console.error("Not able to send response .. macAddress si missing");
  }
};

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

/**
 * Activity to be done after
 * @param {*} options
 */
var wifiMQService = function(options) {
  console.log("Manage wifiMQService");
  let res = options.response;
  if (res.flagReleTemp) {
    console.log("Send Themperature configuration to " + res.macAddress);
  }
  if (res.flagReleLight) {
    console.log("Send Ligth configuration to " + res.macAddress);
  }
  //globaljs.mqClient.p;
  //re;
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
