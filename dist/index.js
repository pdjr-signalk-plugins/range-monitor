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
                    "notificationStates": {
                        "type": "object",
                        "properties": {
                            "inRange": {
                                "title": "Notification state when in range",
                                "type": "string",
                                "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                            },
                            "lowTransit": {
                                "title": "Notification state when below low threshold",
                                "type": "string",
                                "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                            },
                            "highTransit": {
                                "title": "Notification state when above hight threshold",
                                "type": "string",
                                "enum": ["cancel", "normal", "alert", "warn", "alarm", "emergency"]
                            },
                        }
                    }
                },
                "required": ["triggerPath", "lowThreshold", "highThreshold"],
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
module.exports = function (app) {
    var unsubscribes = [];
    var rules = [];
    const plugin = {
        id: PLUGIN_ID,
        name: PLUGIN_NAME,
        description: PLUGIN_DESCRIPTION,
        schema: PLUGIN_SCHEMA,
        uiSchema: PLUGIN_UISCHEMA,
        start: function (config) {
            config = { ...plugin.schema.properties.default, ...config };
            rules = config.rules.reduce((a, configRule) => {
                var rule = {
                    name: configRule.name || undefined,
                    triggerPath: configRule.triggerPath || undefined,
                    lowThreshold: configRule.lowThreshold || undefined,
                    highThreshold: configRule.highThreshold || undefined,
                    notificationPath: configRule.notificationPath || undefined,
                    inRangeNotificationState: ((configRule.notificationStates) && (configRule.notificationStates.inRange)) ? new NotificationState_1.NotificationState(configRule.notificationStates.inRange) : NotificationState_1.NotificationState.normal,
                    lowTransitNotificationState: ((configRule.notificationStates) && (configRule.notificationStates.lowTransit)) ? new NotificationState_1.NotificationState(configRule.notificationStates.lowTransit) : NotificationState_1.NotificationState.alert,
                    highTransitNotificationState: ((configRule.notificationStates) && (configRule.notificationStates.highTransit)) ? new NotificationState_1.NotificationState(configRule.notificationStates.highTransit) : NotificationState_1.NotificationState.alert
                };
                if ((!rule.name) || (!rule.triggerPath) || (!rule.lowThreshold) || (!rule.highThreshold)) {
                    app.debug(`ignoring malformed rule '${rule.name}`);
                }
                else {
                    if (rule.notificationPath === undefined)
                        rule.notificationPath = `notifications.${rule.triggerPath}.${rule.name}`;
                    if (!rule.notificationPath.startsWith('notifications'))
                        rule.notificationPath = `notifications.${rule.triggerPath}.${rule.notificationPath}`;
                    a.push(rule);
                }
                return (a);
            }, []);
            app.debug(`using configuration: ${JSON.stringify(rules, null, 2)}`);
            if (rules.length > 0) {
                app.setPluginStatus(`monitoring ${rules.length} trigger path${(rules.length == 1) ? '' : 's'}`);
                rules.forEach(rule => { app.debug(`monitoring trigger path '${rule.triggerPath}'`); });
                unsubscribes = rules.reduce((a, r) => {
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
                                    app.notify(r.notificationPath, null, plugin.id);
                                    r.lastNotificationState = NotificationState_1.NotificationState.cancel;
                                    break;
                                default:
                                    app.notify(r.notificationPath, { state: getRuleNotificationState(r, tm.state), method: [], message: tm.description }, plugin.id);
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
        },
        stop: function () {
            unsubscribes.forEach((f) => f());
            unsubscribes = [];
        }
    }; // End of plugin
    function getRuleNotificationState(rule, state) {
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
                throw Error(`invalid notification state '${state}'`);
        }
    }
    return (plugin);
};
