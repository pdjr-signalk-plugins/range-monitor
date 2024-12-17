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

import { EventStream } from 'baconjs'
import { NotificationState } from './NotificationState'
import { Rule } from './Rule' 
import { ValueClass } from './ValueClass'
import { Delta } from "signalk-libdelta"

const PLUGIN_ID: string = 'range-notifier'
const PLUGIN_NAME: string = 'pdjr-skplugin-range-notifier'
const PLUGIN_DESCRIPTION: string = 'Raise notifications based on value ranges.'
const PLUGIN_SCHEMA: any = {
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
          "inRangeNotificationState": {
            "title": "Notification state when in range",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
          },
          "lowTransitNotificationState": {
            "title": "Notification state when below low threshold",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
          },
          "highTransitNotificationState": {
            "title": "Notification state when above hight threshold",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency" ]
          }
        },
        "required": [ "triggerPath", "lowThreshold", "highThreshold" ],
      }
    }
  }
};
const PLUGIN_UISCHEMA: any = {};

module.exports = function(app: any) {
  var unsubscribes: (() => void)[] = [];
  var pluginConfiguration: PluginConfiguration = <PluginConfiguration>{};

  const plugin: SKPlugin = {

    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    description: PLUGIN_DESCRIPTION,
    schema: PLUGIN_SCHEMA,
    uiSchema: PLUGIN_UISCHEMA,

    start: function(options: any) {
      var delta: Delta = new Delta(app, plugin.id); 

      try {
        pluginConfiguration = makePluginConfiguration(options);
        app.debug(`using configuration: ${JSON.stringify(pluginConfiguration, null, 2)}`);
        
        if (pluginConfiguration.rules.length > 0) {
          app.setPluginStatus(`Started: monitoring ${pluginConfiguration.rules.length} trigger path${(pluginConfiguration.rules.length == 1)?'':'s'}`);
          pluginConfiguration.rules.forEach(rule  => { app.debug(`applying rule '${rule.name}' to trigger path '${rule.triggerPath}'`); });

          unsubscribes = pluginConfiguration.rules.map((rule) => (
            app.streambundle.getSelfStream(rule.triggerPath)
            .map((value: number) => value2ValueClass(value, rule))
            .skipDuplicates()
            .map((valueclass: ValueClass) => rule.getNotificationState(valueclass))
            .onValue((notificationState: NotificationState) => {
              if (notificationState != rule.lastNotificationState) {
                switch (notificationState) {
                  case NotificationState.cancel:
                    delta.addValue(rule.notificationPath, null).commit().clear();
                    //app.notify(r.notificationPath, null, plugin.id);
                    rule.lastNotificationState = notificationState;
                    break;
                  case NotificationState.undefined:
                    break;
                  default:
                    delta.addValue(rule.notificationPath, { state: notificationState, method: [], message: '' }).commit().clear();
                    //app.notify(r.notificationPath, { state: getRuleNotificationState(r, tm.state), method: [], message: tm.description }, plugin.id);
                    rule.lastNotificationState = notificationState;
                    break;
                }
              }
            })
          ));
        } else {
          app.setPluginStatus('Stopped: configuration includes no valid rules');
        }
      } catch(e: any) {
        app.setPluginStatus('Stopped: plugin configuration error');
        app.setPluginError(e.messge);
      }

      function value2ValueClass(value: number, rule: Rule): ValueClass {
        if (value <= rule.lowThreshold) return(ValueClass.low);
        if (value >= rule.highThreshold) return(ValueClass.high);
        return(ValueClass.inrange);
      }
    
    },

    stop: function() {
      unsubscribes.forEach((f: any) => f())
      unsubscribes = []
    }

  } // End of plugin

  function makePluginConfiguration(options: any): PluginConfiguration {
    var pluginConfiguration: PluginConfiguration = <PluginConfiguration>{};

    if (!options.rules) throw new Error('missing \'rules\' property');
    
    pluginConfiguration.rules = options.rules.map((option: any) => new Rule(option));

    return(pluginConfiguration);
  }

  return(plugin);
}

interface SKPlugin {
  id: string,
  name: string,
  description: string,
  schema: any,
  uiSchema: any,
  start: (options: any) => void,
  stop: () => void
}

interface PluginConfiguration {
  rules: Rule[]
}
