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
/*
var setHeader = function(httpResponse) {
  httpResponse.header("Access-Control-Allow-Origin", "*");
  httpResponse.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
};
*/
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
  // if (!httpUtils.validateBasicAuthentication(httpRequest, httpResponse))
  //   return null;
  // try {
  //   if (!httpUtils.validateBasicAuthentication(httpRequest, httpResponse))
  //     return;
  //   httpResponse.header("Access-Control-Allow-Origin", "*");
  //   httpResponse.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
  // } catch (error) {
  //   httpResponse.json(httpUtils.createResponseKo(500, error));
  // }
  return options;
};

/**
 * Generic activity to validate and manage POST request
 */
var validatePostRequest = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null)
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

exports.monitorOLD = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  setHeader(httpResponse);
  var contype = httpRequest.headers["content-type"];
  console.log("Content Type " + contype);
  // httpResponse.header("Access-Control-Allow-Origin", "*");
  // httpResponse.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");

  try {
    var options = {
      httpRequest: httpRequest,
      httpResponse: httpResponse,
      callback: [],
      request: httpRequest.body,
      lastCallback: genericHTTPPostService
    };
    options.callback.push(genericHTTPPostService);
    thermManager.monitorInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
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

/**
 * Read Configuration
 */
exports.getConfiguration = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    try {
      var type = config.TypeProgramming.THEMP;
      if (httpRequest.query.type) {
        if (httpRequest.query.type === "temp")
          type = config.TypeProgramming.THEMP;
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

/**
 *
 */

exports.checkThermostatStatus = function(httpRequest, httpResponse) {
  var options = validateGetRequest(httpRequest, httpResponse);
  if (options != null) {
    // var options = {
    //   httpRequest: httpRequest,
    //   httpResponse: httpResponse,
    //   callback: [],
    //   lastCallback: genericHTTPPostService
    // };
    options.callback.push(genericHTTPPostService);
    try {
      thermManager.checkThermostatStatus(options);
    } catch (error) {
      options.error = error;
      genericHTTPPostService(options, error);
    }
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
    var type = config.TypeProgramming.THEMP;
    //    var p = myutils.httpGetParam(req);
    if (httpRequest.query.type) {
      if (httpRequest.query.type === "temp")
        type = config.TypeProgramming.THEMP;
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
