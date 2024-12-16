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
                if ((pluginConfiguration.rules) && (pluginConfiguration.rules.length > 0)) {
                    app.setPluginStatus(`Started: monitoring ${pluginConfiguration.rules.length} trigger path${(pluginConfiguration.rules.length == 1) ? '' : 's'}`);
                    pluginConfiguration.rules.forEach(rule => { app.debug(`monitoring trigger path '${rule.triggerPath}'`); });
                    unsubscribes = pluginConfiguration.rules.reduce((a, r) => {
                        var stream = app.streambundle.getSelfStream(r.triggerPath);
                        a.push(stream.map((value) => {
                            var retval;
                            var retval = { state: 'inRange', description: `Monitored value is between ${r.lowThreshold} and ${r.highThreshold}` };
                            app.debug(`low threshold = ${r.lowThreshold}, high threshold = ${r.highThreshold}, value = ${value}`);
                            if (value < r.lowThreshold) {
                                retval = { state: 'lowTransit', description: `Monitored value is below ${r.lowThreshold}` };
                            }
                            else if (value >= r.highThreshold) {
                                retval = { state: 'highTransit', description: `Monitored value is above ${r.highThreshold}` };
                            }
                            return (retval);
                        }).skipDuplicates((a, b) => (a.state == b.state)).onValue((tm) => {
                            app.debug(`comparison on ${r.triggerPath} says '${tm.description}'`);
                            if ((getRuleNotificationState(r, tm.state) != getRuleNotificationState(r, 'last'))) {
                                switch (getRuleNotificationState(r, tm.state)) {
                                    case 'cancel':
                                        delta.addValue(r.notificationPath, null).commit().clear();
                                        //app.notify(r.notificationPath, null, plugin.id);
                                        r.lastNotificationState = NotificationState_1.NotificationState.cancel;
                                        break;
                                    case 'undefined':
                                        break;
                                    default:
                                        delta.addValue(r.notificationPath, { state: getRuleNotificationState(r, tm.state), method: [], message: tm.description }).commit().clear();
                                        //app.notify(r.notificationPath, { state: getRuleNotificationState(r, tm.state), method: [], message: tm.description }, plugin.id);
                                        r.lastNotificationState = new NotificationState_1.NotificationState(tm.state);
                                        break;
                                }
                            }
                        }));
                        return (a);
                    }, []);
                }
                else {
                    app.setPluginStatus('Stopped: configuration includes no valid rules');
                }
            }
            catch (e) {
                app.setPluginStatus('Stopped: plugin configuration error');
                app.setPluginError(e.messge);
            }
        },
        stop: function () {
            unsubscribes.forEach((f) => f());
            unsubscribes = [];
        }
    }; // End of plugin
    function makePluginConfiguration(options) {
        var pluginConfiguration = { rules: [] };
        options.rules.forEach((ruleOptions) => {
            if (!ruleOptions.triggerPath)
                throw new Error('missing \'triggerPath\' property');
            if (!ruleOptions.lowThreshold)
                throw new Error('missing \'lowThreshold\' property');
            if (!ruleOptions.highThreshold)
                throw new Error('missing \'highThreshold\' property');
            var rule = {
                name: ruleOptions.name || 'Innominate rule',
                triggerPath: ruleOptions.triggerPath,
                notificationPath: ruleOptions.notificationPath || `notifications.${ruleOptions.triggerPath}`,
                lowThreshold: ruleOptions.lowThreshold,
                highThreshold: ruleOptions.highThreshold,
                inRangeNotificationState: (ruleOptions.inRangeNotificationState) ? new NotificationState_1.NotificationState(ruleOptions.inRangeNotificationState) : NotificationState_1.NotificationState.undefined,
                lowTransitNotificationState: (ruleOptions.lowTransitNotificationState) ? new NotificationState_1.NotificationState(ruleOptions.lowTransitNotificationState) : NotificationState_1.NotificationState.undefined,
                highTransitNotificationState: (ruleOptions.highTransitNotificationState) ? new NotificationState_1.NotificationState(ruleOptions.highTransitNotificationState) : NotificationState_1.NotificationState.undefined,
                lastNotificationState: undefined
            };
            if (pluginConfiguration.rules)
                pluginConfiguration.rules.push(rule);
        });
        return (pluginConfiguration);
    }
    function getRuleNotificationState(rule, state) {
        var retval;
        switch (state) {
            case 'inRange':
                return (rule.inRangeNotificationState.getName());
                break;
            case 'lowTransit':
                return (rule.lowTransitNotificationState.getName());
                break;
            case 'highTransit':
                return (rule.highTransitNotificationState.getName());
                break;
            case 'last':
                return ((rule.lastNotificationState) ? rule.lastNotificationState.getName() : '');
                break;
            default:
                throw new Error(`unknown state`);
                break;
        }
    }
    return (plugin);
};
