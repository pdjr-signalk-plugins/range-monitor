"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationState_1 = require("./NotificationState");
const Rule_1 = require("./Rule");
const ValueClass_1 = require("./ValueClass");
const signalk_libdelta_1 = require("signalk-libdelta");
const PLUGIN_ID = 'range-notifier';
const PLUGIN_NAME = 'pdjr-skplugin-range-notifier';
const PLUGIN_DESCRIPTION = 'Raise notifications based on value ranges.';
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
                    "inRangeNotificationState": {
                        "title": "Notification state when in range",
                        "type": "string",
                        "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                    },
                    "lowTransitNotificationState": {
                        "title": "Notification state when below low threshold",
                        "type": "string",
                        "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                    },
                    "highTransitNotificationState": {
                        "title": "Notification state when above hight threshold",
                        "type": "string",
                        "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                    }
                },
                "required": ["triggerPath", "lowThreshold", "highThreshold"],
            }
        }
    }
};
const PLUGIN_UISCHEMA = {};
module.exports = function (app) {
    var unsubscribes = [];
    var pluginConfiguration = {};
    const plugin = {
        id: PLUGIN_ID,
        name: PLUGIN_NAME,
        description: PLUGIN_DESCRIPTION,
        schema: PLUGIN_SCHEMA,
        uiSchema: PLUGIN_UISCHEMA,
        start: function (options) {
            var delta = new signalk_libdelta_1.Delta(app, plugin.id);
            try {
                pluginConfiguration = makePluginConfiguration(options);
                app.debug(`using configuration: ${JSON.stringify(pluginConfiguration, null, 2)}`);
                if (pluginConfiguration.rules.length > 0) {
                    app.setPluginStatus(`Started: monitoring ${pluginConfiguration.rules.length} trigger path${(pluginConfiguration.rules.length == 1) ? '' : 's'}`);
                    pluginConfiguration.rules.forEach(rule => { app.debug(`${rule.name} is monitoring trigger path '${rule.triggerPath}'`); });
                    unsubscribes = pluginConfiguration.rules.map((rule) => (app.streambundle.getSelfStream(rule.triggerPath)
                        .map((value) => value2ValueClass(value, rule))
                        .skipDuplicates()
                        .map((valueclass) => rule.getNotificationState(valueclass))
                        .onValue((notificationState) => {
                        if (notificationState != rule.lastNotificationState) {
                            switch (notificationState) {
                                case NotificationState_1.NotificationState.cancel:
                                    delta.addValue(rule.notificationPath, null).commit().clear();
                                    //app.notify(r.notificationPath, null, plugin.id);
                                    rule.lastNotificationState = notificationState;
                                    break;
                                case NotificationState_1.NotificationState.undefined:
                                    break;
                                default:
                                    delta.addValue(rule.notificationPath, { state: notificationState, method: [], message: '' }).commit().clear();
                                    //app.notify(r.notificationPath, { state: getRuleNotificationState(r, tm.state), method: [], message: tm.description }, plugin.id);
                                    rule.lastNotificationState = notificationState;
                                    break;
                            }
                        }
                    })));
                }
                else {
                    app.setPluginStatus('Stopped: configuration includes no valid rules');
                }
            }
            catch (e) {
                app.setPluginStatus('Stopped: plugin configuration error');
                app.setPluginError(e.messge);
            }
            function value2ValueClass(value, rule) {
                if (value <= rule.lowThreshold)
                    return (ValueClass_1.ValueClass.low);
                if (value >= rule.highThreshold)
                    return (ValueClass_1.ValueClass.high);
                return (ValueClass_1.ValueClass.inrange);
            }
        },
        stop: function () {
            unsubscribes.forEach((f) => f());
            unsubscribes = [];
        }
    }; // End of plugin
    function makePluginConfiguration(options) {
        var pluginConfiguration = {};
        if (!options.rules)
            throw new Error('missing \'rules\' property');
        pluginConfiguration.rules = options.rules.map((option) => new Rule_1.Rule(option));
        return (pluginConfiguration);
    }
    return (plugin);
};
