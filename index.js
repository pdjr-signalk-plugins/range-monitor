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

const PLUGIN_ID = "range-notifier";
const PLUGIN_NAME = "pdjr-skplugin-range-notifier";
const PLUGIN_DESCRIPTION = "Raise notifications based on value ranges.";
const PLUGIN_SCHEMA = {
  "type": "object",
  "properties": {
    "rules": {
      "type": "array",
      "title": "Rules",
      "items": {
        "title": "Rule",
        "type": "object",
        "properties": {
          "triggerpath": {
            "title": "Monitored path",
            "type": "string"
          },
          "lowthreshold": {
            "type": "number"
          },
          "highthreshold": {
            "type": "number"
          },
          "notificationpath": {
            "title": "Notification path",
            "type": "string"
          },
          "notifications" : {
            "type": "object",
            "properties": {
              "inrange": {
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

    if (Object.keys(options).length > 0) {
      if ((options.rules) && (Array.isArray(options.rules))) {

        options.rules = options.rules.filter(rule => {
          if ((rule.triggerpath) && (rule.lowthreshold) && (rule.highthreshold)) {
            rule.notificationpath = (rule.notificationpath)?rule.notificationpath:("notifications." + rule.triggerpath);
            rule.notifications = (rule.notifications)?rule.notifications:{};
            return(true);
          } else {
            log.W("ignoring malformed rule (%s)", JSON.stringify(rule), false);
            return(false);
          }
        });
        
        if (options.rules.length > 0) {
          log.N("monitoring %d trigger path%s.", options.rules.length, (options.rules.length == 1)?"":"s");
          options.rules.forEach(rule => { app.debug("monitoring trigger path '%s'", rule.triggerpath); } );

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
              var notification = (comparison == 1)?notifications.hightransit:((comparison == -1)?notifications.lowtransit:notifications.inrange);
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
          log.E("configuration includes no valid rules");
        }
      } else {
        log.E("configuration includes no rules");
      }
    } else {
      log.E("configuration file missing or unusable");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
