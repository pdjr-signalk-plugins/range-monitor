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
	plugin.description = "Issue notifications when a path value goes outside defined limits.";

    const log = new Log(app.setProviderStatus, app.setProviderError, plugin.id);

	plugin.schema = function() {
        return(Schema.createSchema(PLUGIN_SCHEMA_FILE).getSchema());
	}

	plugin.uiSchema = function() {
        return(Schema.createSchema(PLUGIN_UISCHEMA_FILE).getSchema());
	}

    // Expand the path list by splitting each definition into separate low and
    // high components before mapping these into sensor streams which are then
    // monitored for value changes.
    //  
	plugin.start = function(options) {
        log.N("monitoring " + options.paths.length + " path" + ((options.paths.length == 1)?"":"s"), 5000);
		unsubscribes = (options.paths || [])
        .reduce((a, {
            path,
            options,
            message,
            lowthreshold,
            highthreshold
        }) => {
            if (options.includes("enabled")) { 
			    var stream = app.streambundle.getSelfStream(path)
			    a.push(stream.map(value => {
                    lowthreshold['actual'] = highthreshold['actual'] = value;
			        if ((lowthreshold) && (lowthreshold.value) && (value < lowthreshold.value)) {
                        return(-1);
				    } else if ((highthreshold) && (highthreshold.value) && (value > highthreshold.value)) {
                        return(1);
				    } else {
                        return(0);
                    }
			    }).skipDuplicates().onValue(test => {
			        var notification = sendNotificationUpdate(test, path, message, lowthreshold, highthreshold);
                    if (notification == null) {
                        log.N("cancelling notification on '" + path + "'", false);
                    } else if (notification !== undefined) {
                        log.N("issuing notification '" + JSON.stringify(notification), false);
                    }
			    }));
            }
            return(a);
		}, []);
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f())
		unsubscribes = []
	}

	function sendNotificationUpdate(test, path, message, lowthreshold, highthreshold) {
        var notificationValue = null;
        var date = (new Date()).toISOString();
		var delta = { "context": "vessels." + app.selfId, "updates": [ { "source": { "label": "self.notificationhandler" }, "values": [ { "path": "notifications." + path, "value": notificationValue } ] } ] };
		var vessel = app.getSelfPath("name");

		if (test != 0) {
            var state = ((test == 1)?highthreshold:lowthreshold).state;
            var method = ((test == 1)?highthreshold:lowthreshold).method;
            var value = ((test == 1)?highthreshold:lowthreshold).actual;
            var threshold = ((test == 1)?highthreshold:lowthreshold).value;

		    test = (test == -1)?"below":"above";
		    message = (message === undefined)?app.getSelfPath(path + ".meta.displayName"):((!message)?path:eval("`" + message + "`"));
            notificationValue = { "state": state, "message": message, "method": method, "timestamp": date };
		}
        delta.updates[0].values[0].value = notificationValue;
		app.handleMessage(plugin.id, delta);
        return(notificationValue);
	}

	return(plugin);
}
