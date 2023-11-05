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
          "name": {
            "title": "Rule name",
            "type": "string"
          },
          "triggerPath": {
            "title": "Monitored path",
            "type": "string"
          },
          "lowThreshold": {
            "title": "Low threshold",
            "type": "number"
          },
          "highThreshold": {
            "title": "High threshold",
            "type": "number"
          },
          "notificationPath": {
            "title": "Notification path",
            "type": "string"
          },
          "notificationStates" : {
            "type": "object",
            "properties": {
              "inRange": {
                "title": "Notification state when in range",
                "type": "string",
                "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
              },
              "lowTransit": {
                "title": "Notification state when below low threshold",
                "type": "string",
                "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
              },
              "highTransit": {
                "title": "Notification state when above hight threshold",
                  "type": "string",
                  "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
              },
            }
          }
        },
        "required": [ "triggerPath", "lowThreshold", "highThreshold" ],
        "default": {
          "name": "innominate",
          "notificationStates": {}
        }
      },
    }
  },
  "default": {
    "rules": []
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
    plugin.options = { ...plugin.schema.properties.default, ...options };
    plugin.options.rules = plugin.options.rules.reduce((a,rule) => {
      rule = { ...plugin.schema.properties.rules.items.default, ...rule};
      var validRule = {};
      try {
        if (rule.name) validRule.name = rule.name; else throw new Error("missing 'name' property");
        if (rule.triggerPath) validRule.triggerPath = rule.triggerPath; else throw new Error("missing 'triggerPath' property");
        if (rule.lowThreshold) validRule.lowThreshold = rule.lowThreshold; else throw new Error("missing 'lowThreshold' property");
        if (rule.highThreshold) validRule.highThreshold = rule.highThreshold; else throw new Error("missing 'highThreshold' property");
        if (rule.notificationPath === undefined) {
          validRule.notificationPath = `notifications.${validRule.triggerPath}.${validRule.name}`;
        } else if (!rule.notificationPath.startsWith('notifications.')) {
          validRule.notificationPath = `notifications.${validRule.triggerPath}.${rule.notificationPath}`;
        } else {
          validRule.notificationPath = rule.notificationPath;
        }
        validRule.notificationStates = rule.notificationStates || {};
        a.push(validRule);
      } catch(e) { log.W(`dropping rule (${e.message})`, false); }
      return(a);
    }, []);

    app.debug(`using configuration: ${JSON.stringify(plugin.options, null, 2)}`);
        
    if (plugin.options.rules.length > 0) {
      log.N(`monitoring ${plugin.options.rules.length} trigger path${(plugin.options.rules.length == 1)?'':'s'}`);
      plugin.options.rules.forEach(rule => { app.debug(`monitoring trigger path '${rule.triggerPath}'`); });

      unsubscribes = plugin.options.rules.reduce((a, { name, triggerPath, lowThreshold, highThreshold, notificationPath, notificationStates }) => {
        var stream = app.streambundle.getSelfStream(triggerPath);
        a.push(stream.map(value => {
          var retval = { state: 'inRange', description: `Monitored value is between ${lowThreshold} and ${highThreshold}` };
          app.debug(`lowt = ${lowThreshold}, hight = ${highThreshold}, value = ${value}`);
          if (value < lowThreshold) {
            retval = { state: 'lowTransit', description: `Monitored value is below ${lowThreshold}` };
          } else if (value >= highThreshold) {
            retval = { state: 'highTransit', description: `Monitored value is above ${highThreshold}` };
          }
          return(retval);
        }).skipDuplicates((a,b) => (a.state == b.state)).onValue(({ state, description }) => {
          app.debug(`comparison on ${triggerPath} says ${description}`);
          if ((notificationStates[state] !== undefined) && (notificationStates[state] != notificationStates.lastState)) {
            switch (notificationStates[state]) {
              case "cancel":
                plugin.App.notify(notificationPath, null, plugin.id);
                notificationStates.lastState = "cancel";
                break;
              default:
                plugin.App.notify(notificationPath, { state: notificationStates[state], method: [], message: description }, plugin.id);
                notificationStates.lastState = notificationStates[state];
                break;
            }
          }
        }));
        return(a);
      }, []);
    } else {
      log.W("configuration includes no valid rules");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
