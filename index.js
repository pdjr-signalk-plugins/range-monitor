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
	plugin.description = "Issue notifications when some value exceeds some thresholds";

    const log = new Log(app.setProviderStatus, app.setProviderError, plugin.id);

	plugin.schema = function() {
        return(Schema.createSchema(PLUGIN_SCHEMA_FILE).getSchema());
	}

	plugin.uiSchema = function() {
        return(Schema.createSchema(PLUGIN_UISCHEMA_FILE).getSchema());
	}

	plugin.start = function(options) {
        log.N("monitoring " + options.paths.length + " path" + ((options.paths.length == 1)?"":"s"));
		unsubscribes = (options.paths || []).reduce((acc, {
			enabled,
			key,
			message,
            threshold
		}) => {
			if (enabled) {
				var stream = app.streambundle.getSelfStream(key)
				acc.push(stream.map(value => {
					if ((threshold.lowthreshold !== undefined) && (value < threshold.lowthreshold)) {
						return(-1);
					} else if ((threshold.highthreshold !== undefined) && (value > threshold.highthreshold)) {
						return(1);
					} else {
						return(0);
					}
				}).skipDuplicates().onValue(test => {
                    if (test != 0) {
                        log.N(`notifying on ${key}`);
					    sendNotificationUpdate(key, test, 1050, message, threshold.lowthreshold, threshold.highthreshold, threshold.notificationtype, threshold.notificationrequest, threshold.notificationoptions);
                    }
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

	function sendNotificationUpdate(key, test, value, message, lowthreshold, highthreshold, notificationtype, notificationrequest, notificationoptions) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + key, "value": notificationValue } ] } ] };

		if (test != 0) {
			var vesselName = app.getSelfPath("name");
		    var test = (test == -1)?"below":"above";
		    var threshold = (test == -1)?lowthreshold:highthreshold;
		    var message = (message === undefined)?app.getSelfPath(key + ".meta.displayName"):((!message)?key:eval("`" + message + "`"));
            notificationValue = { "state": notificationtype, "message": `${vesselName}: ${message}`, "method": notificationrequest, "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		    //delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + key, "value": notificationValue } ] } ] };
		} else if (notificationoptions.includes("inrange")) {
            notificationValue = { "state": "normal", "message": "", "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		    //var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + key, "value": notificationValue } ] } ] };
		}
	}

	return(plugin);
}
