/*
 * Copyright 2018 Paul Reeve <preeve@pdjr.eu>
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

const Delta = require('./lib/signalk-libdelta/Delta.js');
const Log = require('./lib/signalk-liblog/Log.js');

const PLUGIN_ID = "threshold-notifier";
const PLUGIN_NAME = "pdjr-skplugin-threshold-notifier";
const PLUGIN_DESCRIPTION = "Raise notifications based on some path value.";
const PLUGIN_SCHEMA = {
  "type": "object",
  "properties": {
    "rules": {
      "type": "array",
      "title": "",
      "items": {
        "title": "Rule",
        "type": "object",
        "properties": {
          "triggerpath": {
            "title": "Monitored path",
            "type": "string"
          },
          "notificationpath": {
            "title": "Notification path",
            "type": "string"
          },
          "lowthreshold": {
            "type": "number"
          },
          "highthreshold": {
            "type": "number"
          },
          "notifications" : {
            "type": "object",
            "properties": {
              "nominal": {
                "type": "object",
                "properties": {
                  "message": {
                    "title": "Notification message",
                    "type": "string",
                    "default": "${path} is nominal (${value})"
                  },
                  "state": {
                    "title": "Alarm state",
                    "type": "string",
                    "default": "normal",
                    "enum": [ "normal", "alert", "warn", "alarm", "emergency" ]
                  },
                  "method": {
                    "title": "Suggested method",
                    "type": "array",
                    "default": [],
                    "items": {
                      "type": "string",
                      "enum": [ "visual", "sound" ]
                    },
                    "uniqueItems": true
                  }
                }
              },
              "lowtransit": {
                "type": "object",
                "properties": {
                  "message": {
                    "title": "Notification message",
                    "type": "string",
                    "default": "${path} is ${test} ${threshold} (${value})"
                  },
                  "state": {
                    "title": "Alarm state",
                    "type": "string",
                    "default": "alert",
                    "enum": [ "normal", "alert", "warn", "alarm", "emergency" ]
                  },
                  "method": {
                    "title": "Suggested method",
                    "type": "array",
                    "default": [],
                    "items": {
                      "type": "string",
                      "enum": [ "visual", "sound" ]
                    },
                    "uniqueItems": true
                  }
                }
              },
              "hightransit": {
                "type": "object",
                "properties": {
                  "message": {
                    "title": "Notification message",
                    "type": "string",
                    "default": "${path} is ${test} ${threshold} (${value})"
                  },
                  "state": {
                    "title": "Alarm state",
                    "type": "string",
                    "default": "alert",
                    "enum": [ "normal", "alert", "warn", "alarm", "emergency" ]
                  },
                  "method": {
                    "title": "Suggested method",
                    "type": "array",
                    "default": [],
                    "items": {
                      "type": "string",
                      "enum": [ "visual", "sound" ]
                    },
                    "uniqueItems": true
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "default": {
    "rules": [
    ]
  }
};
const PLUGIN_UISCHEMA = {};

module.exports = function(app) {
  var plugin = {};
  var unsubscribes = [];

  plugin.id = PLUGIN_ID;
  plugin.name = PLUGIN_NAME;
  plugin.description = PLUGIN_DESCRIPTION;
  plugin.schema = PLUGIN_SCHEMA;
  plugin.uiSchema = PLUGIN_UISCHEMA;

  const delta = new Delta(app, plugin.id);
  const log = new Log(plugin.id, { ncallback: app.setPluginStatus, ecallback: app.setPluginError });

  plugin.start = function(options) {

    if (Object.keys(options).length === 0) {
      options = plugin.schema.default;
      log.W("using default configuratiom");
    }

    if ((options.rules) && (Array.isArray(options.rules)) && (options.rules.length > 0)) {
      log.N("started: monitoring %d trigger path%s (see log for details).", options.rules.length, (options.rules.length == 1)?"":"s");
      options.rules.forEach(rule => { log.N("monitoring trigger path '%s'", rule.triggerpath, false); } );

      unsubscribes = options.rules.reduce((a, { triggerpath, notificationpath, lowthreshold, highthreshold, notifications }) => {
        var stream = app.streambundle.getSelfStream(triggerpath);
        a.push(stream.map(value => {
          var retval = 0;
          notifications.value = value;
          notifications.test = "between";
          notifications.threshold = lowthreshold + " and " + highthreshold;
          app.debug("lowt = %d, hight = %d, value = %d", lowthreshold, highthreshold, value);
          if ((lowthreshold) && (value < lowthreshold)) {
            retval = -1;
            notifications.test = "below";
            notifications.threshold = lowthreshold;
          } else if ((highthreshold) && (value >= highthreshold)) {
            retval = 1;
            notifications.test = "above"
            notifications.threshold = highthreshold;
          }
          return(retval);
        }).skipDuplicates().onValue(comparison => {
          app.debug("comparison on %s yields %d", triggerpath, comparison);
          var notification = (comparison == 1)?notifications.hightransit:((comparison == -1)?notifications.lowtransit:notifications.nominal);
          if ((notification !== undefined) && (notification != notifications.lastNotification)) {
            if (notification === null) {
              app.debug("deleting notification on \'%s\'", notificationpath);
            } else {
              notification.message = notification.message
              .replace(/\${path}/g, triggerpath)
              .replace(/\${test}/g, notifications.test)
              .replace(/\${threshold}/g, notifications.threshold)
              .replace(/\${value}/g, notifications.value);
              app.debug("issuing \'%s\' notification on \'%s\'", notification.state, notificationpath);
            }
            notifications.lastNotification = notification;
            delta.clear().addValue(notificationpath, notification).commit();
          }
        }));
        return(a);
      }, []);
    } else {
      log.N("stopped: missing, bad or empty configuration.");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
