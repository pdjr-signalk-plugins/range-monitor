"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationState = void 0;
class NotificationState {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return (this.name);
    }
}
exports.NotificationState = NotificationState;
NotificationState.cancel = new NotificationState('cancel');
NotificationState.normal = new NotificationState('normal');
NotificationState.alert = new NotificationState('alert');
NotificationState.warn = new NotificationState('warn');
NotificationState.alarm = new NotificationState('alarm');
NotificationState.emergency = new NotificationState('emergency');
