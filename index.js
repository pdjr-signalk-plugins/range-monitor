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

const MyApp = require('signalk-libapp/App.js');
const Log = require('signalk-liblog/Log.js');

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
          "triggerPath": {
            "title": "Monitored path",
            "type": "string"
          },
          "lowThreshold": {
            "type": "number"
          },
          "highThreshold": {
            "type": "number"
          },
          "notificationPath": {
            "title": "Notification path",
            "type": "string"
          },
          "notifications" : {
            "type": "object",
            "properties": {
              "inRange": {
                "type": "object",
                "properties": {
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
                  },
                  "message": {
                    "title": "Notification message",
                    "type": "string",
                    "default": "${path} is nominal (${value})"
                  }
                },
                "default": {
                  "state": "normal",
                  "method": [],
                  "message": "${path} is nominal (${value})"
                }
              },
              "lowTransit": {
                "type": "object",
                "properties": {
                  "state": {
                    "title": "Alarm state",
                    "type": "string",
                    "enum": [ "normal", "alert", "warn", "alarm", "emergency" ]
                  },
                  "method": {
                    "title": "Suggested method",
                    "type": "array",
                    "items": {
                      "type": "string",
                      "enum": [ "visual", "sound" ]
                    },
                    "uniqueItems": true
                  },
                  "message": {
                    "title": "Notification message",
                    "type": "string"
                  }
                },
                "default": {
                  "state": "alert",
                  "method": [],
                  "message": "${path} is ${test} ${threshold} (${value})"
                }
              },
              "highTransit": {
                "type": "object",
                "properties": {
                  "state": {
                    "title": "Alarm state",
                    "type": "string",
                    "enum": [ "normal", "alert", "warn", "alarm", "emergency" ]
                  },
                  "method": {
                    "title": "Suggested method",
                    "type": "array",
                    "items": {
                      "type": "string",
                      "enum": [ "visual", "sound" ]
                    },
                    "uniqueItems": true
                  },
                  "message": {
                    "title": "Notification message",
                    "type": "string"
                  }
                },
                "default": {
                  "state": "alert",
                  "method": [],
                  "message": "${path} is ${test} ${threshold} (${value})"
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
    plugin.options.rules = (options.rules || []).reduce((a,rule) => {
      var validRule = {};
      try {
        if (rule.triggerPath) validRule.triggerPath = rule.triggerPath; else throw new Error("missing 'triggerPath' property");
        if (rule.lowThreshold) validRule.lowThreshold = rule.lowThreshold; else throw new Error("missing 'lowThreshold' property");
        if (rule.highThreshold) validRule.highThreshold = rule.highThreshold; else throw new Error("missing 'highThreshold' property");
        validRule.notificationPath = (rule.notificationPath)?rule.notificationPath:`notifications.${rule.triggerPath}`;
        validRule.notifications = {};
        validRule.notifications.inRange = { ...plugin.schema.properties.rules.items.properties.notifications.properties.inRange.default, ...rule.notifications.inRange };
        validRule.notifications.lowTransit = { ...plugin.schema.properties.rules.items.properties.notifications.properties.lowTransit.default, ...rule.notifications.lowTransit };
        validRule.notifications.highTransit = { ...plugin.schema.properties.rules.items.properties.notifications.properties.highTransit.default, ...rule.notifications.highTransit };
        a.push(validRule);
      } catch(e) { log.W(`dropping `)}
      return(a);
    }, []);

    app.debug(`using configuration: ${JSON.stringify(plugin.options, null, 2)}`);
        
    if (plugin.options.rules.length > 0) {
      log.N(`monitoring ${plugin.options.rules.length} trigger path${(plugin.options.rules.length == 1)?'':'s'}`);
      plugin.options.rules.forEach(rule => { app.debug(`monitoring trigger path '${rule.triggerPath}'`); });

      unsubscribes = plugin.options.rules.reduce((a, { triggerPath, notificationPath, lowThreshold, highThreshold, notifications }) => {
        var stream = app.streambundle.getSelfStream(triggerPath);
        a.push(stream.map(value => {
          var retval = 0;
          notifications.value = value;
          notifications.test = 'between';
          notifications.threshold = `${lowThreshold} and ${highThreshold}`;
          app.debug(`lowt = ${lowThreshold}, hight = ${highThreshold}, value = ${value}`);
          if ((lowThreshold) && (value < lowThreshold)) {
            retval = -1;
            notifications.test = 'below';
            notifications.threshold = lowThreshold;
          } else if ((highThreshold) && (value >= highThreshold)) {
            retval = 1;
            notifications.test = 'above'
            notifications.threshold = highThreshold;
          }
          return(retval);
        }).skipDuplicates().onValue(comparison => {
          app.debug(`comparison on ${triggerPath} yields ${comparison}`);
          var notification = (comparison == 1)?notifications.highTransit:((comparison == -1)?notifications.lowTransit:notifications.inrange);
          if ((notification !== undefined) && (notification != notifications.lastNotification)) {
            if (notification === null) {
              app.debug(`deleting notification on '${notificationPath}'`);
            } else {
              notification.message = notification.message
              .replace(/\${path}/g, triggerPath)
              .replace(/\${test}/g, notifications.test)
              .replace(/\${threshold}/g, notifications.threshold)
              .replace(/\${value}/g, notifications.value);
              app.debug(`issuing '${notification.state}' notification on '${notificationPath}'`);
            }
            notifications.lastNotification = notification;
            plugin.App.notify(notificationPath, notification, plugin.id);
          }
        }));
        return(a);
      }, []);
    } else {
      log.E("configuration includes no valid rules");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
