var readConfiguration = function (termStatdb,param) {
	var confColl = termStatdb.getCollection(globaljs.CONF);
	var conf = confColl.findOne({
		_id: param.macAddress,
	}
		, function (err, doc) {
			if (err)
				console.error("ERRORE lettura configurazione " + err);
			else {
				if (doc)
				{

				} else if(param.createIfNull)
				{

				}
			}
		}
	);
	if (conf) {
		console.log("Configuration found for macAddress : " + macAddress);
	} else {
		if (createIfNull) {
			// ADD
			console.log("Configuration not found for macAddress : " + macAddress + " .. add default");
			conf = getConfigurationRecord(macAddress, 0);
			conf.lastAccess = Date.now();
			conf.lastUpdate = conf.lastAccess;
			confColl.insert(conf);
		}
	}
	return conf;
};