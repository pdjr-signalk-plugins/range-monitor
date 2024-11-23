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

const MyApp = require('./lib/signalk-libapp/App.js');
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
      },
      "default": []
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
  plugin.App = new MyApp(app);

  const log = new Log(plugin.id, { ncallback: app.setPluginStatus, ecallback: app.setPluginError });

  plugin.start = function(options) {
    plugin.options = {};
    plugin.options.rules = (options.rules)?options.rules:plugin.schema.properties.rules.default;

    if ((plugin.options.rules) && (Array.isArray(plugin.options.rules))) {
      plugin.options.rules = plugin.options.rules.filter(rule => {
        if ((rule.triggerpath) && (rule.lowthreshold) && (rule.highthreshold)) {
          rule.notificationpath = (rule.notificationpath)?rule.notificationpath:(`notifications.${rule.triggerpath}`);
          rule.notifications = (rule.notifications)?rule.notifications:{};
          return(true);
        } else {
          log.W(`ignoring malformed rule (${JSON.stringify(rule)})`);
          return(false);
        }
      });
        
      if (plugin.options.rules.length > 0) {
        log.N(`monitoring ${plugin.options.rules.length} trigger path${(plugin.options.rules.length == 1)?'':'s'}`);
        plugin.options.rules.forEach(rule => { app.debug(`monitoring trigger path '${rule.triggerpath}'`); });

        unsubscribes = plugin.options.rules.reduce((a, { triggerpath, notificationpath, lowthreshold, highthreshold, notifications }) => {
          var stream = app.streambundle.getSelfStream(triggerpath);
          a.push(stream.map(value => {
            var retval = 0;
            notifications.value = value;
            notifications.test = 'between';
            notifications.threshold = `${lowthreshold} and ${highthreshold}`;
            app.debug(`lowt = ${lowthreshold}, hight = ${highthreshold}, value = ${value}`);
            if ((lowthreshold) && (value < lowthreshold)) {
              retval = -1;
              notifications.test = 'below';
              notifications.threshold = lowthreshold;
            } else if ((highthreshold) && (value >= highthreshold)) {
              retval = 1;
              notifications.test = 'above'
              notifications.threshold = highthreshold;
            }
            return(retval);
          }).skipDuplicates().onValue(comparison => {
            app.debug(`comparison on ${triggerpath} yields ${comparison}`);
            var notification = (comparison == 1)?notifications.hightransit:((comparison == -1)?notifications.lowtransit:notifications.inrange);
            if ((notification !== undefined) && (notification != notifications.lastNotification)) {
              if (notification === null) {
                app.debug(`deleting notification on '${notificationpath}'`);
              } else {
                notification.message = notification.message
                .replace(/\${path}/g, triggerpath)
                .replace(/\${test}/g, notifications.test)
                .replace(/\${threshold}/g, notifications.threshold)
                .replace(/\${value}/g, notifications.value);
                app.debug(`issuing '${notification.state}' notification on '${notificationpath}'`);
              }
              notifications.lastNotification = notification;
              plugin.App.notify(notificationpath, notification, plugin.id);
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
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
