const globaljs = require("./global");
const config = require("./config");
const myutils = require("./utils/myutils");
const mongoDBMgr = require("./mongoDBManager");
const shellyMgr = require("./shellyManager");
const netList = require("network-list");

//lastCallback;
/*
exports.callbackNEW = function(options, error) {
  if (error) options.error = error;
  if (options.callback) options.callback(options);
  else if (options.lastCallback) options.lastCallback(options);
};
*/
var callback = function(options, error) {
  if (error) options.error = error;
  let useCallBack = true;
  if (typeof options.usePromise != "undefined")
    useCallBack = !options.usePromise;
  if (useCallBack) {
    if (options.callback && options.callback.length > 0) {
      if (typeof options.callbackIndex === "undefined")
        options.callbackIndex = 0;
      if (options.callbackIndex < options.callback.length) {
        options.callback[options.callbackIndex++](options);
      }
    }
  } else {
    if (error) options.reject(error);
    else options.resolve(options);
  }
};

exports.callback = callback;
/**
 * Thermostat programming management
 */
exports.manageProgramming = function(options, resolveIn, rejectIn) {
  switch (options.action) {
    case config.TypeAction.READ:
      mongoDBMgr.readProgramming(options);
      break;
    case config.TypeAction.UPDATE:
      options.response = options.programm;
      mongoDBMgr.updateProgramming(options, resolveIn, rejectIn);
      break;
    case config.TypeAction.ADD:
    case config.TypeAction.DELETE:
      new Promise(function(resolve, reject) {
        mongoDBMgr.readProgramming(options, resolve, reject);
      })
        .then(function(options) {
          if (options.action == config.TypeAction.ADD)
            mongoDBMgr.addProgramming(options, resolveIn, rejectIn);
          else if (options.action == config.TypeAction.DELETE)
            mongoDBMgr.deleteProgramming(options, resolveIn, rejectIn);
        })
        .catch(function(error) {
          reject(error);
        });
      break;
  }
  /*
  if (options.action === config.TypeAction.READ)
    mongoDBMgr.readProgramming(options);
  else if (options.action === config.TypeAction.ADD) {
    options.callback.unshift(mongoDBMgr.addProgramming);
    mongoDBMgr.readProgramming(options);
  } else if (options.action === config.TypeAction.DELETE) {
    new Promise(function(resolve, reject) {
      mongoDBMgr.readProgramming(options, resolve, reject);
    })
      .then(function(options) {
        mongoDBMgr.deleteProgramming(options, resolveIn, rejectIn);
        // return new Promise(function(resolve, reject) {
        //   mongoDBMgr.deleteProgramming(options, resolve1, reject1);
        // });
      })
      .catch(function(error) {
        reject(error);
      });
  }
  */
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
  mongoDBMgr.readProgramming(options);
};

/**
 * Check if any shelly device is present. If so register it
 */
exports.shellyRegisterInternal = function(options) {
  console.log("Find shelly devices ..");
  netList.scan({ vendor: false, timeout: 10 }, (err, arr) => {
    if (err) {
      callback(options, err);
    } else {
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
          var outOptions = {
            ip: entry.ip,
            mac: mac
          };
          shellyMgr.updateShellyConfiguration(outOptions);
          newFound++;
        }
      }
      var out = {
        networkDevices: arr.length,
        networkDevicesAlive: nAlive,
        networkDevicesShelly: nShelly,
        networkDevicesNew: newFound
      };
      options.response = out;
      callback(options);
    }
  });
};

exports.checkThermostatStatus = function(options) {
  // recupera dispositivo rele termostato
  // recupera confugurazione e modalità di misura
  // recupera temperature
  // calcola
  mongoDBMgr.readThermostatProgramming(options);
};
