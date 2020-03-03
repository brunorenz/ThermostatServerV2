var globaljs = require("./global");
var config = require("./config");
var httpUtils = require("./utils/httpUtils");
var thermManager = require("./thermManager");
var mq = require("./thermServerMQ");
var security = require("./securityManager");
/**
 * Send JSON response
 */
var genericHTTPPostService = function(options) {
  if (options.httpResponse) {
    let res = options.httpResponse;
    if (options.error) {
      let errorCode = 500;
      if (options.errorCode != "undefined") errorCode = options.errorCode;
      res.json(httpUtils.createResponseKo(errorCode, options.error));
    } else {
      if (options.response)
        res.json(httpUtils.createResponse(options.response));
      else res.json(httpUtils.createResponse(null, 100, "Record not Found"));
    }
  }
};

/**
 * Generic activity to validate and manage GET request
 */
var validateGetRequest = function(httpRequest, httpResponse) {
  var options = {
    httpRequest: httpRequest,
    httpResponse: httpResponse,
    usePromise: false,
    callback: []
  };
  return options;
};

/**
 * Generic activity to validate and manage POST request
 */
var validatePostRequest = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  try {
    // check request encode
    var contype = httpRequest.headers["content-type"];
    console.log("Request ContentType : " + contype);
    if (!contype || contype.indexOf("application/json") >= 0)
      options.request = httpRequest.body;
    else options.request = httpRequest.body.data;
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
  return options;
};

exports.monitor = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  try {
    options.callback.push(genericHTTPPostService);
    thermManager.monitorInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Update Programming Record
 */
exports.updateProgramming = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  try {
    let input = JSON.parse(options.request);
    options.programmingType = input.type;
    options.programm = input.programm;
    options.action = config.TypeAction.UPDATE;
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.manageProgramming(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Delete Programming Record
 */
exports.deleteProgramming = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  try {
    let input = JSON.parse(options.request);
    options.programmingType = input.type;
    options.idProg = input.id;
    options.action = config.TypeAction.DELETE;
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.manageProgramming(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Add Programming Record
 */
exports.addProgramming = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  try {
    let input = JSON.parse(options.request);
    options.programmingType = input.type;
    options.action = config.TypeAction.ADD;
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.manageProgramming(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Update Configuration
 */
exports.updateConfiguration = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  try {
    options.callback.push(genericHTTPPostService);
    thermManager.updateConfigurationInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

exports.updateStatus = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.updateStatus(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};

exports.updateConfigurationN = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.updateConfiguration(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};
/**
 * Read Configuration
 */
exports.getConfiguration = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    try {
      var type = config.TypeProgramming.TEMP;
      if (httpRequest.query.type) {
        if (httpRequest.query.type === "temp")
          type = config.TypeProgramming.TEMP;
        else if (httpRequest.query.type === "light")
          type = config.TypeProgramming.LIGTH;
      }
      options.action = config.TypeAction.READ;
      options.callback.push(genericHTTPPostService);
      options.createIfNull = false;
      options.update = false;
      thermManager.readConfigurationInternal(options);
    } catch (error) {
      httpResponse.json(httpUtils.createResponseKo(500, error));
    }
  }
};

exports.getReleData = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.getReleData(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};

exports.getSensorData = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.getSensorData(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};

/**
 *
 */

exports.checkThermostatStatus = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.checkThermostatStatus(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};

exports.updateTemperatureReleStatus = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  if (options != null) {
    options.usePromise = true;
    new Promise(function(resolve, reject) {
      thermManager.updateTemperatureReleStatus(options, resolve, reject);
    })
      .then(function(options) {
        genericHTTPPostService(options);
      })
      .catch(function(error) {
        httpResponse.json(httpUtils.createResponseKo(500, error));
      });
  }
};
/**
 * Scan th local network finding for Schelly devices
 */
exports.shellyRegister = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  setHeader(httpResponse);
  // httpResponse.header("Access-Control-Allow-Origin", "*");
  // httpResponse.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");

  var options = {
    httpRequest: httpRequest,
    httpResponse: httpResponse,
    action: config.TypeAction.READ,
    callback: [],
    createIfNull: true,
    lastCallback: genericHTTPPostService
  };
  options.callback.push(genericHTTPPostService);
  try {
    thermManager.shellyRegisterInternal(options);
  } catch (error) {
    options.error = error;
    genericHTTPPostService(options, error);
  }
};

/**
 * Get programming info type = temp/light prog = all / reset
 * @param {*} httpRequest
 * @param {*} httpResponse
 */
exports.getProgramming = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    var type = config.TypeProgramming.TEMP;
    //    var p = myutils.httpGetParam(req);
    if (httpRequest.query.type) {
      if (httpRequest.query.type === "temp") type = config.TypeProgramming.TEMP;
      else if (httpRequest.query.type === "light")
        type = config.TypeProgramming.LIGTH;
    }
    options.programmingType = type;
    options.action = config.TypeAction.READ;
    options.createIfNull = true;
    options.callback.push(genericHTTPPostService);
    try {
      thermManager.manageProgramming(options);
    } catch (error) {
      options.error = error;
      genericHTTPPostService(options, error);
    }
  }
};

/**
 * Login function
 */
exports.login = function(httpRequest, httpResponse) {
  var options = validatePostRequest(httpRequest, httpResponse);
  if (options != null) {
    options.callback.push(genericHTTPPostService);
    let input = JSON.parse(options.request);
    console.log(JSON.stringify(input));
    security.readUser(options);
  } else {
    genericHTTPPostService(options, "Generic error");
  }
};

exports.getReleStatistics = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  options.statisticType = "RELE";
  getStatistics(options);
};

exports.getSensorStatistics = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  options.statisticType = "SENSOR";
  getStatistics(options);
};

var getStatistics = function(options) {
  options.usePromise = true;
  options.depth = 24; //  hour
  options.interval = 15; //minutes
  if (typeof options.httpRequest.query.type != "undefined") {
    options.depth = options.httpRequest.query.type === "hour" ? 1 : 24;
    options.interval = options.depth === 1 ? 5 : 15;
  }
  if (typeof options.httpRequest.query.interval != "undefined")
    options.interval = parseInt(options.httpRequest.query.interval);

  new Promise(function(resolve, reject) {
    thermManager.getStatistics(options, resolve, reject);
  })
    .then(function(options) {
      genericHTTPPostService(options);
    })
    .catch(function(error) {
      options.httpResponse.json(httpUtils.createResponseKo(500, error));
    });
};
