var thermManager = require("./thermManager");
const globaljs = require("./global");

var checkTemperature = function() {
  var options = {
    usePromise: false,
    callback: []
  };

  console.log("Start Timer for CheckTemperature ..");
  try {
    thermManager.checkThermostatStatus(options);
  } catch (error) {
    console.log("Errore in task checkThermostatStatus : " + error);
  }
  setTimeout(checkTemperature, globaljs.MONITOR_TIMEOUT);
};

exports.checkTemperature = checkTemperature;
