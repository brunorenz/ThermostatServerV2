var http = require("http");
var webSocket = require("ws");
var globaljs = require("../global");
var security = require("../securityManager");

var params = function(req) {
  var result = {};
  var q = req.url.split("?");
  if (q.length >= 2) {
    var items = q[1].split("&");

    //.forEach(function(item)
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      try {
        result[item.split("=")[0]] = item.split("=")[1];
      } catch (e) {
        result[item.split("=")[0]] = "";
      }
    } //);
  }
  return result;
};

var httpPostJSON = function(options, postData, mycallback, param) {
  var headers = {
    "Content-Type": "application/json"
  };

  options.headers = headers;
  options.method = "POST";

  var req = http.request(options, function(res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));
    res.setEncoding("utf8");
    var body = "";
    res.on("data", function(d) {
      body += d;
    });
    res.on("end", function() {
      var parsed = JSON.parse(body);

      if (mycallback && typeof mycallback === "function") {
        if (param) {
          mycallback(parsed, param);
        } else {
          mycallback(parsed);
        }
      } else {
        console.log("RESPONSE: " + body);
      }
    });
  });

  req.on("error", function(err) {
    console.log(err);
  });
  req.write(JSON.stringify(postData));
  req.end();
};

var httpGetJSON = function(options, mycallback, param) {
  var headers = {
    "Content-Type": "application/json"
  };

  options.headers = headers;
  options.method = "GET";

  var req = http.get(options, function(res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));
    res.setEncoding("utf8");
    var body = "";
    res.on("data", function(d) {
      body += d;
    });
    res.on("end", function() {
      var parsed = JSON.parse(body);

      if (mycallback && typeof mycallback === "function") {
        if (param) {
          mycallback(parsed, param);
        } else {
          mycallback(parsed);
        }
      } else {
        console.log("RESPONSE: " + body);
      }
    });
  });

  req.on("error", function(err) {
    console.log(err);
  });
};

var webSocketSendEvent = function(event) {
  var map = globaljs.WSS;
  if (map) {
    map.forEach(function f(entry) {
      var ws = entry.value.ws;
      console.log("CLIENT " + entry.key + " STATE : " + ws.readyState);
      if (ws.readyState === webSocket.OPEN) {
        console.log("Send EVENT " + event);
        ws.send(event);
      } else {
        console.log("Pospone EVENT " + event);
        entry.value.command = event;
        mapPut(map, entry.key, entry.value);
      }
    });
  }
};

var webSocketConnection = function(ws, req) {
  var s = globaljs.WSS;
  if (!s) {
    s = [];
    globaljs.WSS = s;
  }

  var ip = req.connection.remoteAddress;
  var entry = mapGet(s, ip);
  if (!entry) {
    console.log("WEBSOCKET (ADD) connection from client ip " + ip);
    entry = {
      ws: ws,
      command: null
    };
    mapPut(s, ip, entry);
  } else {
    console.log("WEBSOCKET (UPDATE) connection from client ip " + ip);
    entry.ws = ws;
    if (entry.command && entry.command !== null) {
      ws.send(entry.command);
      entry.command = null;
    }
    mapPut(s, ip, entry);
  }

  console.log("WEBSOCKET connection from client ip " + ip);
};

/**
 * Create errore response code
 * @param {*} errorCode
 * @param {*} message
 */
var createResponseKo = function(errorCode, error) {
  let message = error;
  if (error instanceof Error) {
    message = error.name + " : " + error.message;
  }
  return createResponse(null, errorCode, message);
};
/**
 * Create generic response
 */
var createResponse = function(object, errorCode, message) {
  if (!errorCode) {
    errorCode = 0;
    message = "OK";
  }
  var error = {
    code: errorCode,
    message: message
  };
  var response = {
    error: error
  };
  if (object !== null) {
    response.data = object;
  }
  return response;
}; //
/****
/**
 * Check basic authentication from http header

var validateBasicAuthentication = function(req, res) {
  var rc = true;
  if (
    (req.method === "GET" || req.method === "POST") &&
    globaljs.BASIC_AUTH_REQUIRED
  ) {
    if (!req.headers.authorization) {
      res
        .status(401)
        .send("missing authorization header")
        .end();
      rc = false;
    } else if (req.headers.authorization !== globaljs.BASIC_AUTH) {
      res.status(401).end();
      rc = false;
    }
  }
  return rc;
};

/**
 * Check basic authentication from http header
 
var validateJWTSecurity = function(req, res) {
  var rc = true;
  if (req.path.endsWith("login")) return true;
  if (
    globaljs.JWT.enabled &&
    ((globaljs.JWT.securityGET && req.method === "GET") ||
      (globaljs.JWT.securityPOST && req.method === "POST"))
  ) {
    if (typeof req.headers.jwttoken === "undefined") {
      res
        .status(401)
        .send("missing jwt token header")
        .end();
      rc = false;
    } else {
      let ok = security.verifyToken(req.headers.jwttoken);
      if (!ok) {
        res
          .status(403)
          .send("Token expired")
          .end();
        rc = false;
      }
    }
  }
  return rc;
};

exports.checkBasicSecurity = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, jwttoken"
  );
  //res.header("Access-Control-Allow-Methods", "*");
  //res.header("Access-Control-Allow-Credentials", "true");
  res.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
  if (validateBasicAuthentication(req, res) && validateJWTSecurity(req, res)) {
    next();
  } else {
    console.log("Check BASIC Security, JWT and set CORS : Fails!");
  }
};
*/

module.exports.createResponse = createResponse;
module.exports.createResponseKo = createResponseKo;
//module.exports.validateBasicAuthentication = validateBasicAuthentication;
module.exports.webSocketSendEvent = webSocketSendEvent;
module.exports.webSocketConnection = webSocketConnection;
module.exports.httpGetJSON = httpGetJSON;
module.exports.httpPostJSON = httpPostJSON;
module.exports.httpGetParam = params;
