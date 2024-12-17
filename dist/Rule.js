"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const NotificationState_1 = require("./NotificationState");
const ValueClass_1 = require("./ValueClass");
class Rule {
    constructor(options) {
        this.name = '';
        this.triggerPath = '';
        this.lowThreshold = 0;
        this.highThreshold = 0;
        this.notificationPath = '';
        this.inRangeNotificationState = NotificationState_1.NotificationState.undefined;
        this.lowTransitNotificationState = NotificationState_1.NotificationState.undefined;
        this.highTransitNotificationState = NotificationState_1.NotificationState.undefined;
        this.lastNotificationState = NotificationState_1.NotificationState.undefined;
        if (!options.triggerPath)
            throw new Error('missing \'triggerPath\' property');
        if (!options.lowThreshold)
            throw new Error('missing \'lowThreshold\' property');
        if (!options.highThreshold)
            throw new Error('missing \'highThreshold\' property');
        this.name = options.name || 'innominate';
        this.triggerPath = options.triggerPath;
        this.notificationPath = options.notificationPath || `notifications.${options.triggerPath}`;
        this.lowThreshold = options.lowThreshold;
        this.highThreshold = options.highThreshold;
        this.inRangeNotificationState = (options.inRangeNotificationState) ? new NotificationState_1.NotificationState(options.inRangeNotificationState) : NotificationState_1.NotificationState.undefined,
            this.lowTransitNotificationState = (options.lowTransitNotificationState) ? new NotificationState_1.NotificationState(options.lowTransitNotificationState) : NotificationState_1.NotificationState.undefined,
            this.highTransitNotificationState = (options.highTransitNotificationState) ? new NotificationState_1.NotificationState(options.highTransitNotificationState) : NotificationState_1.NotificationState.undefined,
            this.lastNotificationState = NotificationState_1.NotificationState.undefined;
    }
    getNotificationState(valueClass) {
        switch (valueClass) {
            case ValueClass_1.ValueClass.inrange: return (this.inRangeNotificationState);
            case ValueClass_1.ValueClass.low: return (this.lowTransitNotificationState);
            case ValueClass_1.ValueClass.high: return (this.highTransitNotificationState);
            case ValueClass_1.ValueClass.last: return (this.lastNotificationState);
        }
        return (NotificationState_1.NotificationState.undefined);
    }
}
exports.Rule = Rule;
