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

exports.callback = function(options, error) {
  if (error) options.error = error;
  if (options.callback && options.callback.length > 0) {
    if (typeof options.callbackIndex === "undefined") options.callbackIndex = 0;
    if (options.callbackIndex < options.callback.length) {
      options.callback[options.callbackIndex++](options);
    }
  }
};

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
