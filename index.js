/*
 * Copyright 2018 Paul Reeve <paul@pdjr.eu>
 * Portions Copyright (2017) Scott Bender (see https://github.com/sbender9/signalk-simple-notifications)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        .reduce((a, p) => {
            p.thresholds.forEach(threshold => {
                a.push({ "enabled": p.enabled, "path": p.path, "message": p.message, "threshold": threshold });
            });
            return(a);
        }, [])
        .reduce((acc, {
			enabled,
			path,
			message,
            threshold
		}) => {
			if (enabled) {
				var stream = app.streambundle.getSelfStream(path)
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
                    log.N(`notifying on ${path}`);
					sendNotificationUpdate(path, test, threshold.value, message, threshold.lowthreshold, threshold.highthreshold, threshold.notificationtype, threshold.notificationoptions);
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

	function sendNotificationUpdate(path, test, value, message, lowthreshold, highthreshold, notificationtype, notificationoptions) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + path, "value": notificationValue } ] } ] };
		var vessel = app.getSelfPath("name");
        var threshold = "";

		if (test != 0) {
		    test = (test == -1)?"below":"above";
		    threshold = (test == -1)?lowthreshold:highthreshold;
		    message = (message === undefined)?app.getSelfPath(path + ".meta.displayName"):((!message)?path:eval("`" + message + "`"));
            notificationValue = { "state": notificationtype, "message": message, "method": notificationoptions, "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		} else if (notificationoptions.includes("inrange")) {
            test = (lowthreshold === undefined)?"below":((highthreshold === undefined)?"above":"between");
            threshold = (lowthreshold === undefined)?highthreshold:((highthreshold === undefined)?lowthreshold:`${lowthreshold} and ${highthreshold}`);
            message = eval("`" + message + "`");
            notificationValue = { "state": "normal", "message": message, "method": notificationoptions, "timestamp": date };
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		}
	}

	return(plugin);
}
