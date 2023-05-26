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
    "version": { "const": "3.0.0"},
    "rules": {
      "type": "array",
      "title": "",
      "items": {
        "title": "Rule",
        "type": "object",
        "properties": {
          "enabled": {
            "title": "Enable rule?",
            "type": "boolean",
            "default": true
          },
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
  }
};
const PLUGIN_UISCHEMA = {};

const OPTIONS_DEFAULT = {
  "version": "3.0.0",
  "rules": []
};

const OPTIONS_SUPPORTED_VERSIONS = [ "3.0.0" ];

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
      log.N("plugin configuration file missing or empty.", false);
      options = OPTIONS_DEFAULT;
      app.savePluginOptions(options, () => { log.N("saving default configuration and restarting plugin.", false) });
    }

    if ((options.version) && (OPTIONS_SUPPORTED_VERSIONS.includes(options.version))) {
      log.N("configuration file claims to be version '%s'", options.version, false);
      if ((options.rules) && (Array.isArray(options.rules))) {
        options.rules = options.rules.filter(rule => rule.enabled);
        if (options.rules.length > 0) {
          log.N("started: monitoring %d trigger path%s.", options.rules.length, (options.rules.length == 1)?"":"s");
          options.rules.forEach(rule => { log.N("monitoring trigger path '%s'", rule.triggerpath, false); } );

          unsubscribes = options.rules.reduce((a, { triggerpath, notificationpath, lowthreshold, highthreshold, notifications }) => {
            var stream = app.streambundle.getSelfStream(triggerpath);
            a.push(stream.map(value => {
              var retval = 0;
              notifications.value = value;
              notifications.test = "between";
              notifications.threshold = lowthreshold + " and " + highthreshold;
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
              var notification = (comparison == 1)?notifications.hightransit:((comparison == -1)?notifications.lowtransit:notifications.nominal);
              if ((notification) && (notification != notifications.lastNotification)) {
                notification.message = notification.message
                .replace(/\${path}/g, triggerpath)
                .replace(/\${test}/g, notifications.test)
                .replace(/\${threshold}/g, notifications.threshold)
                .replace(/\${value}/g, notifications.value);
                log.N("issuing \'%s\' notification on \'%s\'", notification.state, notificationpath);
                notifications.lastNotification = notification;
                delta.clear().addValue(notificationpath, notification).commit();
              }
            }));
            return(a);
          }, []);
        } else {
          log.W("stopped: configuration includes no active rules.");
        }
      } else {
        log.E("stopped: configuration error.");
      }
    } else {
      log.E("stopped: invalid or unspecified configuration version.");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
