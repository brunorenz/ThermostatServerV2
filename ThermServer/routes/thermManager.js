var globaljs = require("./global");
var mongoDBMgr = require("./mongoDBManager");
var TypeAction = { READ: 1, RESET: 2, UPDATE: 3, DELETE: 4 };
exports.TypeAction = TypeAction;

//lastCallback;

exports.callbackNEW = function(options, error) {
  if (error) options.error = error;
  if (options.callback) options.callback(options);
  else if (options.lastCallback) options.lastCallback(options);
};

var callback = function(options, error) {
  if (error) options.error = error;
  if (options.callback && options.callback.length > 0) {
    if (typeof options.callbackIndex === "undefined") options.callbackIndex = 0;
    if (options.callbackIndex < options.callback.length) {
      options.callback[options.callbackIndex++](options);
    }
  }
};

exports.callback = this.callback;
/**
 * Thermostat programming management
 */
exports.manageProgramming = function(options) {
  if (options.action === TypeAction.READ) {
    mongoDBMgr.readProgramming(options);
  }
};
/**
 * check and update thermostat configuration
 */
exports.checkConfigurationInternal = function(options) {};

/**
 * check and update thermostat configuration
 */
exports.monitorInternal = function(options) {
  mongoDBMgr.monitorData(options);
};

/**
 * Thermostat register function
 */
exports.readConfigurationInternal = function(options) {
  //
  options.createIfNull = false;
  options.update = false;
  mongoDBMgr.readConfiguration(options);
};

/**
 * Update configuration
 */
exports.updateConfigurationInternal = function(options) {
  mongoDBMgr.updateConfiguration(options);
};

/**
 * rigister a device
 */
exports.wifiRegisterInternal = function(options) {
  //
  options.createIfNull = true;
  mongoDBMgr.readConfiguration(options);
};

var readProgramming = function(options) {
  options.createIfNull = true;
  //options.internalCallback
  mongoDBMgr.readProgramming(options);
};

exports.shellyRegisterInternal = function(options) {
  const netList = require("network-list");

  // get list of mac address already registerd
  console.log("Find shelly device ..");
  netList.scan({ vendor: false, timeout: 2 }, (err, arr) => {
    if (err) {
      callback(options, err);
    } else {
      //console.log(arr);
      // array with all devices
      nAlive = 0;
      nShelly = 0;
      for (let i = 0; i < arr.length; i++) {
        let entry = arr[i];
        if (entry.alive) {
          nAlive++;
          var mac = entry.mac != null ? entry.mac.toUpperCase() : "N/A";
          console.log(
            "Chech for IP address " + entry.ip + " with mac address " + mac
          );
          callShellyStatus(entry.ip);
          // faccio chiamata a ip:/shelly
        }
      }
      var out = {
        networkDevices: arr.length,
        networkDevicesAlive: nAlive,
        networkDevicesShelly: nShelly
      };
      options.response = out;
      /*
       */
      callback(options);
    }
  });
};

var callShellyStatus = function(ip, callback) {
  const https = require("http");
  const options = {
    hostname: ip,
    port: 80,
    path: "/shelly",
    method: "GET"
  };

  const req = https.request(options, res => {
    console.log("IP : " + ip + " - HTTP status code " + res.statusCode);
  });

  // TIMEOUT PART
  req.setTimeout(1000, function() {
    console.log("Server connection timeout (after 1 second)");
    req.abort();
  });

  req.on("error", error => {
    console.error("IP : " + ip + " - Error " + error);
  });

  req.end();
};
