const globaljs = require("./global");
const config = require("./config");
const myutils = require("./utils/myutils");
const mongoDBMgr = require("./mongoDBManager");
const http = require("http");

var callShellySetting = function(options) {
  const httpOptions = {
    hostname: options.ip,
    port: 80,
    path: "/settings",
    method: "GET",
    headers: { Authorization: globaljs.basicAuthShelly }
  };
  var output = "";
  const req = http.request(httpOptions, res => {
    console.log("HTTP response code " + res.statusCode);
    res.on("end", end => {
      let obj = JSON.parse(output);
      //console.log("Result : " + output);
      console.log("ID : "+obj.mqtt.id);
      var input = config.getConfigurationRecord(options.mac);
      input.deviceType = config.TypeDeviceType.SHELLY;
      input.ipAddress = options.ip;
      input.shellyMqttId = obj.mqtt.id;
      var dbOptions = {
        request: input,
        macAddress: options.mac,
        callback: [],
        register: true,
        update: true,
        createIfNull : true
      };

      mongoDBMgr.readConfiguration(dbOptions);
    });
    res.on("data", data => {
      output += data;
    });
  });
  req.setTimeout(2000, function() {
    console.log(
      ">> TIMEOUT occurred calling " + httpOptions.ip + httpOptions.path
    );
    req.abort();
  });
  req.on("error", error => {
    console.log(
      "Http error calling " + httpOptions.ip + httpOptions.path + " : " + error
    );
  });
  req.end();
};

var updateShellyConfiguration = function(options, rc) {
  console.log("IP : " + options.ip + " - HTTP status code " + rc);
  if (rc === 200) {
    // update mongodb
    console.log(
      "Update shelly configuration for IP/MAC : " +
        options.ip +
        " - " +
        options.mac
    );
    callShellySetting(options);
    /*
    var input = config.getConfigurationRecord(mac);
    input.deviceType = config.TypeDeviceType.SHELLY;
    input.ipAddress = options.ip;
    var dbOptions = {
      request: input,
      macAddress: mac,
      callback: [],
      register: true,
      update: true
    };
    options.createIfNull = true;
    mongoDBMgr.readConfiguration(options);
    console.log("ADD IP/MAC : " + ip + " - " + mac);
    */
  } else {
    console.log(
      "IP/MAC : " + options.ip + " - " + options.mac + " is not a shelly device"
    );
  }
};

exports.updateShellyConfiguration = function(options) {
  const httpOptions = {
    hostname: options.ip,
    port: 80,
    path: "/shelly",
    method: "GET"
  };
  //   var options = {
  //     ip: ip,
  //     mac: mac
  //   };
  const req = http.request(httpOptions, res => {
    updateShellyConfiguration(options, res.statusCode);
  });
  req.setTimeout(2000, function() {
    console.log(
      ">> TIMEOUT occurred calling " + httpOptions.ip + httpOptions.path
    );
    req.abort();
  });
  req.on("error", error => {
    console.log(
      ">> ERROR occurred calling " +
        httpOptions.ip +
        httpOptions.path +
        " : " +
        error
    );
  });
  req.end();
};
