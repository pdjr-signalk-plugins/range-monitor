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
        .reduce((a, {
            path,
            message,
            lowthreshold,
            highthreshold
        }) => {
            if ((lowthreshold) && (lowthreshold.value)) {
                a.push({
                    "path": path,
                    "message": message,
                    "type": "lowthreshold",
                    "lowthreshold": lowthreshold,
                    "highthreshold": highthreshold
                });
            }
            if ((highthreshold) && (highthreshold.value)) {
                a.push({
                    "path": path,
                    "message": message,
                    "type": "highthreshold",
                    "lowthreshold": lowthreshold,
                    "highthreshold": highthreshold
                });
            }
            return(a);
        }, [])
        .map(({
            path,
            message,
            type,
            lowthreshold,
            highthreshold
        }) => {
			var stream = app.streambundle.getSelfStream(path)
			return(stream.map(value => {
                if (lowthreshold) lowthreshold['actual'] = value;
                if (highthreshold) highthreshold['actual'] = value;
			    if ((type == "lowthreshold") && (value < lowthreshold.value)) {
					return(-1);
				} else if ((type == "highthreshold") && (value > highthreshold.value)) {
					return(1);
				} else {
					return(0);
				}
			}).skipDuplicates().onValue(test => {
				sendNotificationUpdate(test, path, message, type, lowthreshold, highthreshold);
			}));
		});
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f())
		unsubscribes = []
	}

	function sendNotificationUpdate(test, path, message, type, lowthreshold, highthreshold) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + path, "value": notificationValue } ] } ] };
		var vessel = app.getSelfPath("name");
        var threshold = (type == "lowthreshold")?lowthreshold.value:highthreshold.value;
        var state = (type == "lowthreshold")?lowthreshold.state:highthreshold.state;
        var method = (type == "lowthreshold")?lowthreshold.method:highthreshold.method;
        var value = (type == "lowthreshold")?lowthreshold.actual:highthreshold.actual;
        var testzero = ((type == "lowthreshold") && lowthreshold.options.includes("two-way")) || ((type == "highthreshold") && highthreshold.options.includes("two-way"));

		if (test != 0) {
		    test = (test == -1)?"below":"above";
		    switching = (test == "below")?"stopping":"starting";
		    message = (message === undefined)?app.getSelfPath(path + ".meta.displayName"):((!message)?path:eval("`" + message + "`"));
            notificationValue = { "state": state, "message": message, "method": method, "timestamp": date };
            log.N(JSON.stringify(notificationValue), false);
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		} else if (testzero) {
            test = (lowthreshold && highthreshold)?"between":((lowthreshold)?"below":"above");
            threshold = (lowthreshold && highthreshold)?`${lowthreshold.value} and ${highthreshold.value}`:threshold;
            message = eval("`" + message + "`");
            notificationValue = { "state": "normal", "message": message, "method": method, "timestamp": date };
            log.N(JSON.stringify(notificationValue), false);
            delta.updates[0].values[0].value = notificationValue;
		    app.handleMessage(plugin.id, delta);
		}
	}

	return(plugin);
}
