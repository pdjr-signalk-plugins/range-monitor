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

import { ControlValue } from './ControlValue';
import { Rule } from './Rule';
import { Range } from './Range';
import { Delta } from 'signalk-libdelta';
import { PluginStatus } from 'signalk-libpluginstatus';

const PLUGIN_ID: string = 'range-monitor';
const PLUGIN_NAME: string = 'pdjr-range-monitor';
const PLUGIN_DESCRIPTION: string = 'Monitor path values against range thresholds.';
const PLUGIN_SCHEMA: any = {
  "type": "object",
  "properties": {
    "rules": {
      "title": "Rules",
      "type": "array",
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
          "controlPath": {
            "title": "Control path",
            "type": "string"
          },
          "inRangeControlValue": {
            "title": "Control value to use when value on monitored path moves in range",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency", "on", "off" ]
          },
          "lowTransitControlValue": {
            "title": "Control value to use when value on monitored path moves below low threshold",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency", "on", "off" ]
          },
          "highTransitControlValue": {
            "title": "Control value to use when value on monitored path moves above high threshold",
            "type": "string",
            "enum": [ "cancel", "normal", "alert", "warn", "alarm", "emergency", "on", "off" ]
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
  var pluginStatus: PluginStatus;

  const plugin: SKPlugin = {

    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    description: PLUGIN_DESCRIPTION,
    schema: PLUGIN_SCHEMA,
    uiSchema: PLUGIN_UISCHEMA,

    start: function(options: any) {
      var delta: Delta = new Delta(app, plugin.id);
      pluginStatus = new PluginStatus(app, 'started');

      try {
        pluginConfiguration = makePluginConfiguration(options);
        app.debug(`using configuration: ${JSON.stringify(pluginConfiguration, null, 2)}`);
        
        if (pluginConfiguration.rules.length > 0) {
          pluginStatus.setDefaultStatus(`operating ${pluginConfiguration.rules.length} range monitor rule${(pluginConfiguration.rules.length == 1)?'':'s'}`);
          pluginConfiguration.rules.forEach(rule  => { app.debug(`applying rule '${rule.name}' to trigger path '${rule.triggerPath}'`); });

          unsubscribes = pluginConfiguration.rules.map((rule) => (
            app.streambundle.getSelfStream(rule.triggerPath)
            .skipDuplicates()
            .map((value: number) => { app.debug(`rule '${rule.name}' received value ${value}`); return(value2ValueClass(value, rule)); })
            .skipDuplicates()
            .map((range: Range) => { app.debug(`rule '${rule.name}' value classified as '${range.getName()}'`); return(rule.getControlValue(range)); })
            .onValue((controlValue: ControlValue) => {
              if (controlValue != rule.lastControlValue) {
                switch (controlValue.getName()) {
                  case 'cancel':
                    delta.addValue(rule.controlPath, null).commit().clear();
                    pluginStatus.setStatus(`rule '${rule.name}': cancelling notification on '${rule.controlPath}'`);
                    rule.lastControlValue = controlValue;
                    break;
                  case 'undefined':
                    break;
                  default:
                    if (controlValue.isSwitch()) {
                      delta.addValue(`${rule.controlPath}.state`, (controlValue.is('on'))?1:0).commit().clear();
                      pluginStatus.setStatus(`rule '${rule.name}': switching '${rule.controlPath}' ${controlValue.getName().toUpperCase()}`);
                    } else {
                      delta.addValue(rule.controlPath, { state: controlValue.getName(), method: [], message: '' }).commit().clear();
                      pluginStatus.setStatus(`rule '${rule.name}': issuing '${controlValue.getName()}' notification on '${rule.controlPath}'`);          
                    }
                    rule.lastControlValue = controlValue;
                    break;
                }
              }
            })
          ));
        } else {
          pluginStatus.setDefaultStatus('stopped: configuration includes no valid rules');
        }
      } catch(e: any) {
        pluginStatus.setDefaultStatus('stopped: plugin configuration error');
        app.setPluginError(e.messge);
      }

      function value2ValueClass(value: number, rule: Rule): Range {
        if (value <= rule.lowThreshold) return(Range.low);
        if (value >= rule.highThreshold) return(Range.high);
        return(Range.inrange);
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

