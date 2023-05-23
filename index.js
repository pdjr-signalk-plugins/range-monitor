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
          "enabled": {
            "title": "Enable rule?",
            "type": "boolean",
            "default": true
          },
          "lowthreshold": {
            "title": "",
            "type": "object",
            "properties": {
              "value": {
                "title": "Low threshold",
                "type": "number"
              },                        
              "message": {
                "title": "Notification message",
                "type": "string",
                "default": "${vessel}: ${path} is ${test} ${threshold} (${value})"
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
          "highthreshold": {
            "title": "",
            "type": "object",
            "properties": {
              "value": {
                "title": "High threshold",
                "type": "number"
              },                        
              "message": {
                "title": "Notification message",
                "type": "string",
                "default": "${vessel}: ${path} is ${test} ${threshold} (${value})"
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
};
const PLUGIN_UISCHEMA = {};

const OPTIONS_DEFAULT = {
  "rules": []
};

const NOTIFICATION_PREFIX = "notifications.";

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
      options = OPTIONS_DEFAULT;
      app.savePluginOptions(options, () => {
        log.N("plugin configuration file missing or invalid.", false);
        log.N("saving default configuration and restarting plugin.", false)
      });
    }

    if ((options.rules) && (Array.isArray(options.rules))) {
      options.rules = options.rules.filter(rule => rule.enabled);
      if (options.rules.length > 0) {
        if (options.rules.length == 1) {
          log.N("applying threshold rule to '%s'", options.rules[0].triggerpath);
        } else {
          log.N("applying multiple threshold rules (see log for details).");
          options.rules.forEach(rule => { log.N("applying threshold rule to '%s'", rule.triggerpath, false); } );
        }

        unsubscribes = options.rules.reduce((a, { triggerpath, notificationpath, lowthreshold, highthreshold }) => {
          var stream = app.streambundle.getSelfStream(triggerpath);
          a.push(stream.map(value => {
            var retval = 0;
            if (lowthreshold) lowthreshold['actual'] = value;
            if (highthreshold) highthreshold['actual'] = value;
            if ((lowthreshold) && (lowthreshold.value) && (value < lowthreshold.value)) {
              retval = -1;
            } else if ((highthreshold) && (highthreshold.value) && (value > highthreshold.value)) {
              retval = 1;
            }
            return(retval);
          }).skipDuplicates().onValue(test => {
            var nactual = (lowthreshold)?lowthreshold.actual:highthreshold.actual;
            if (test == 0) {
              var noti = app.getSelfPath(notificationpath);
              if (noti != null) {
                //log.N(nactual + " => cancelling '" + noti.value.state + "' notification on '" + npath + "'", false);
                //cancelNotification(npath);
              }
            } else {
              var nstate = (test == -1)?lowthreshold.state:highthreshold.state;
              log.N(nactual + " => issuing '" + nstate + "' notification on '" + notificationpath + "'");
              delta.clear().addValue(notificationpath, {
                "message": nstate.message,
                "state": ((test == 1)?highthreshold:lowthreshold).state,
                "method": ((test == 1)?highthreshold:lowthreshold).method
              }).commit();
            }
          }));
          return(a);
        }, []);
      } else {
        log.N("stopped: configuration includes no rules");
      }
    } else {
      log.N("stopped: configuration 'rules' entry is invalid");
    }
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return(plugin);
}
