var thermManager = require("./thermManager");
const globaljs = require("./global");

var checkTemperature = function() {
  var options = {
    usePromise: true
  };
  console.log("Start Timer for CheckTemperature ..");
  new Promise(function(resolve, reject) {
    thermManager.checkThermostatStatus(options, resolve, reject);
  })
    .then(function(options) {
      console.log(
        "Aggiornato stato timer : " + JSON.stringify(options.response)
      );
    })
    .catch(function(error) {
      console.log("Errore in task checkThermostatStatus : " + error);
    });
  setTimeout(checkTemperature, globaljs.MONITOR_TIMEOUT);
};

exports.checkTemperature = checkTemperature;
