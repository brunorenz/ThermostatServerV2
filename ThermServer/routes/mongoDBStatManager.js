const globaljs = require("./global");

let getReleStatistics = function(options, resolve, reject) {
  var _finalize = function(key, value) {
    let outValue = value;
    if (typeof value.on === "undefined") {
      outValue = {
        on: this.status ? 1 : 0,
        off: this.status ? 0 : 1,
        tot: 1
      };
    }

    return outValue;
  };
  var _map = function() {
    var floorTimeSecond = function(interval, time) {
      var div = 60 * 1000 * interval;
      var l1 = time;
      var l2 = Math.floor(l1 / div) * div;
      return new Date(l2);
    };
    var out = {
      on: this.status ? 1 : 0,
      off: this.status ? 0 : 1,
      tot: 1
    };
    var key = {
      server: this.shellyId,
      time: floorTimeSecond(interval, this.time)
    };
    emit(key, out);
  };
  var _reduce = function(key, values) {
    var reduce = null;
    for (var index = 0; index < values.length; ++index) {
      var entry = values[index];

      //if (entry.tot > 1 || reduce === null) {
      if (reduce === null) {
        reduce = entry;
      } else {
        reduce.on += entry.on;
        reduce.off += entry.off;
        reduce.tot += entry.tot;
      }
    }
    return reduce;
  };

  var _createResultFunction = function(err, values) {
    if (err) {
      console.log("ERROR in getReleStatistics mapReduce -  " + err);
      reject(err);
    } else {
      var out = [];
      for (var i = 0; i < values.length; i++) {
        var entry = {
          key: {
            server: values[i]._id.server,
            time: values[i]._id.time.getTime()
          },
          value: values[i].value
        };
        out.push(entry);
      }

      options.response = out;
      resolve(options);
    }
  };

  var query = {
    $and: [
      {
        time: {
          $gte: options.startTime
        }
      },
      {
        time: {
          $lt: options.endTime
        }
      }
    ]
  };
  // statistiche sensori Temperatura
  // singola e media
  // statistiche altri sensori (luce / umidita / pressione)
  // recupero sensosi
  // per ogni sensore map/reduce per statitiche
  // input tipo (ultima ora /giorno)
  //       risoluzione (minuti)
  console.log(
    "Collect RELE Statistics from " +
      new Date(options.startTime) +
      " to " +
      new Date(options.endTime)
  );

  globaljs.mongoCon.collection(globaljs.MONGO_SHELLYSTAT).mapReduce(
    _map,
    _reduce,
    {
      query: query,
      out: { inline: 1 },
      scope: {
        interval: options.interval,
        detail: true
      },
      finalize: _finalize
    },
    _createResultFunction
  );
};

let getSensorStatistics = function(options, resolve, reject) {
  var _finalize = function(key, value) {
    if (value.tot > 0) {
      value.elaOk = value.elaOk / value.tot;
      value.sizeOk = value.sizeOk / value.tot;
    }

    return value;
  };
  var _map = function() {
    var floorTimeSecond = function(interval, time) {
      var div = 1000 * interval;
      var l1 = time;
      var l2 = Math.floor(l1 / div) * div;
      return new Date(l2);
    };
    var out = {
      ok: 0,
      ko: 0,
      tot: 1,
      elaOk: 0,
      sizeOk: 0
    };
    var key = {
      server: this.server
      //time: floorTimeSecond(1, this.tms_exe)
    };
    if (detail) key.time = floorTimeSecond(1, this.time);
    if (interval > 0) {
      key.time = floorTimeSecond(interval, this.time);
    }
    if (this.rc < 400) {
      out.ok = 1;
      out.elaOk = this.elapse;
      out.sizeOk = this.size;
    } else {
      out.ko = 1;
    }
    emit(key, out);
  };
  var _reduce = function(key, values) {
    var reduce = null;
    for (var index = 0; index < values.length; ++index) {
      var entry = values[index];

      //if (entry.tot > 1 || reduce === null) {
      if (reduce === null) {
        reduce = entry;
      } else {
        reduce.ok += entry.ok;
        reduce.ko += entry.ko;
        reduce.tot += entry.tot;
        reduce.elaOk += entry.elaOk;
        reduce.sizeOk += entry.sizeOk;
      }
    }
    return reduce;
  };

  var query = {
    $and: [
      {
        time: {
          $gte: inputData.fromTime
        }
      },
      {
        time: {
          $lt: inputData.toTime
        }
      }
    ]
  };
  // statistiche sensori Temperatura
  // singola e media
  // statistiche altri sensori (luce / umidita / pressione)
  // recupero sensosi
  // per ogni sensore map/reduce per statitiche
  // input tipo (ultima ora /giorno)
  //       risoluzione (minuti)
  console.log(
    "collectHTTPPerformanceStatistics start .. with " +
      JSON.stringify(inputData) +
      " .. Query : " +
      JSON.stringify(query)
  );
  globaljs.mongoCon.collection(globaljs.collLog).mapReduce(
    _map,
    _reduce,
    {
      query: query,
      out: {
        replace: "tempHTTPPerformanceResult"
      },
      scope: {
        interval: inputData.interval,
        detail: inputData.detail
      },
      finalize: _finalize
    },
    function(err, collection, stats) {
      if (err) {
        console.log(
          "ERROR in collectHTTPPerformanceStatistics mapReduce -  " + err
        );
        res.json(httpUtils.createResponse(null, 500, err));
      } else {
        collection.find({}).toArray(function(err, values) {
          var out = [];
          if (values) {
            console.log("Restituiti " + values.length + " record!");
            // pulisco
            for (var i = 0; i < values.length; i++) {
              var entry = {
                key: {
                  server: values[i]._id.server
                },
                value: values[i].value
              };
              if (values[i]._id.time) entry.key.time = values[i]._id.time;
              out.push(entry);
            }
          }
          var result = {
            configurazione: {
              infDate: inputData.fromTime,
              supDate: inputData.toTime,
              interval: inputData.interval
            },
            dati: out
          };
          res.json(httpUtils.createResponse(result));
        });
      }
    }
  );
};

exports.getSensorStatistics = getSensorStatistics;
exports.getReleStatistics = getReleStatistics;
