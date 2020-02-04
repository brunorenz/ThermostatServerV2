var thermManager = require("./thermManager");

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
  setTimeout(checkTemperature, 5000);
};

exports.checkTemperature = checkTemperature;
