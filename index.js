const Bacon = require('baconjs')
const Schema = require('./lib/schema.js');
const Log = require('./lib/log.js');

const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";

module.exports = function(app) {
	var plugin = {};
	var unsubscribes = [];

	plugin.id = "threshold-notifier";
	plugin.name = "Threshold notifier";
	plugin.description = "Issue notifications when some value exceeds some thresholds.";

    const log = new Log(app.setProviderStatus, app.setProviderError, plugin.id);

	plugin.schema = function() {
        return(Schema.createSchema(PLUGIN_SCHEMA_FILE).getSchema());
	}

	plugin.uiSchema = function() {
        return(Schema.createSchema(PLUGIN_UISCHEMA_FILE).getSchema());
	}

	plugin.start = function(options) {
        log.N("monitoring " + options.paths.length + " path" + ((options.paths.length == 1)?"":"s"), 5000);
		unsubscribes = (options.paths || [])
        .reduce((a, path) => {
            path.thresholds.forEach(threshold => {
                a.push({ "enabled": path.enabled, "key": path.key, "message": path.message, "threshold": threshold });
            });
            return(a);
        }, [])
        .reduce((acc, {
			enabled,
			key,
			message,
            threshold
		}) => {
			if (enabled) {
				var stream = app.streambundle.getSelfStream(key)
				acc.push(stream.map(value => {
                    threshold.value = value;
					if ((threshold.lowthreshold !== undefined) && (value < threshold.lowthreshold)) {
						return(-1);
					} else if ((threshold.highthreshold !== undefined) && (value > threshold.highthreshold)) {
						return(1);
					} else {
						return(0);
					}
				}).skipDuplicates().onValue(test => {
                    log.N(`notifying on ${key}`);
					sendNotificationUpdate(key, test, threshold.value, message, threshold.lowthreshold, threshold.highthreshold, threshold.notificationtype, threshold.notificationoptions);
				}));
			}
			return(acc);
		}, [])
		return(true);
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f())
		unsubscribes = []
	}

	function sendNotificationUpdate(key, test, value, message, lowthreshold, highthreshold, notificationtype, notificationoptions) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + key, "value": notificationValue } ] } ] };
		var vessel = app.getSelfPath("name");
        var threshold = "";

		if (test != 0) {
		    test = (test == -1)?"below":"above";
		    threshold = (test == -1)?lowthreshold:highthreshold;
		    message = (message === undefined)?app.getSelfPath(key + ".meta.displayName"):((!message)?key:eval("`" + message + "`"));
            notificationValue = { "state": notificationtype, "message": message, "method": notificationoptions, "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		} else if (notificationoptions.includes("inrange")) {
            test = (lowthreshold === undefined)?"below":((highthreshold === undefined)?"above":"between");
            threshold = (lowthreshold === undefined)?highthreshold:((highthreshold === undefined)?lowthreshold:`${lowthreshold} and ${highthreshold}`);
            message = eval("`" + message + "`");
            notificationValue = { "state": "normal", "message": message, "method": notificationoptions, "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
            app.debug("delta: " + JSON.stringify(delta));
		    app.handleMessage(plugin.id, delta);
		}
	}

	return(plugin);
}
