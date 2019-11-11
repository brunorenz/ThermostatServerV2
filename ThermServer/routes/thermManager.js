var globaljs = require("./global");
var mongoDBMgr = require("./mongoDBManager");
var TypeAction = { READ: 1, RESET: 2, UPDATE: 3, DELETE: 4 };
exports.TypeAction = TypeAction;

/**
 * Thermostat programming management
 */
exports.programmingInternal = function(options) {
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
