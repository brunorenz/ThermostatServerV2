var globaljs = require("./global");
var config = require("./config");
var myutils = require("./utils/myutils");
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

exports.callback = callback;
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
      newFound = 0;
      for (let i = 0; i < arr.length; i++) {
        let entry = arr[i];
        if (entry.alive) {
          nAlive++;
          var mac = entry.mac != null ? entry.mac.toUpperCase() : "N/A";
          console.log(
            "Chech for IP address " + entry.ip + " with mac address " + mac
          );
          callShellyStatus(entry.ip, mac);
          newFound++;
          /*
          var sc = myutils.mapGet(globaljs.shellyCache, mac);
          let update = true;
          if (sc && sc.ip === ip) {
            update = false;
          }
          if (update) {
            // faccio chiamata a ip:/shelly
            callShellyStatus(entry.ip, mac);
            newFound++;
          }*/
        }
      }
      var out = {
        networkDevices: arr.length,
        networkDevicesAlive: nAlive,
        networkDevicesShelly: nShelly,
        networkDevicesNew: newFound
      };
      options.response = out;
      /*
       */
      callback(options);
    }
  });
};

var callShellySetting = function(ip)
{
  const https = require("http");
  const options = {
    hostname: ip,
    port: 80,
    path: "/settings",
    method: "GET",
    headers:{"Authorization": globaljs.basicAuthShelly 
    }
  };
  var output = "";
  const req = https.request(options, res => {
    console.log("HTTP response code "+res.statusCode);
    res.on('end', end =>  {
      let obj = JSON.parse(output);
      console.log("Result : "+output)
      //onResult(res.statusCode, obj);
    });
    res.on('data', function(data) {
      output += data;
    });
  });
 
  req.on("error", error => {
    update(ip, mac, 999);
  });

  req.end();
}

var callShellyStatus = function(ip, mac, callback) {
  const https = require("http");
  const options = {
    hostname: ip,
    port: 80,
    path: "/shelly",
    method: "GET"
  };
  var update = function(ip, mac, rc) {
    console.log("IP : " + ip + " - HTTP status code " + rc);
    if (rc === 200) {
      // update mongodb
      var input = config.getConfigurationRecord(mac);
      input.deviceType = config.TypeDeviceType.SHELLY;
      input.ipAddress = ip;
      var options = {
        request: input,
        macAddress: mac,
        callback: [],
        register: true,
        update: true
      };
      callShellySetting(ip);
      options.createIfNull = true;
      mongoDBMgr.readConfiguration(options);
      // var d = {
      //   ip: ip
      // };
      console.log("ADD IP/MAC : " + ip + " - " + mac);
      // myutils.mapPut(globaljs.shellyCache, mac, d);
    }
  };
  const req = https.request(options, res => {
    update(ip, mac, res.statusCode);
  });
  req.setTimeout(2000, function() {
    console.log(">> TIMEOUT occurred for IP/MAC " + ip + " - " + mac);
    req.abort();
  });
  req.on("error", error => {
    update(ip, mac, 999);
  });
  req.end();
};
