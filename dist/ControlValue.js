"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlValue = void 0;
class ControlValue {
    constructor(name) {
        if (_a.VALID_VALUES.includes(name)) {
            this.name = name;
        }
        else {
            throw new Error(`requested control value name is invalid ('${name}')`);
        }
    }
    getName() {
        return (this.name);
    }
    isNotification() {
        return (_a.NOTIFICATION_VALUES.includes(this.name));
    }
    isSwitch() {
        return (_a.SWITCH_VALUES.includes(this.name));
    }
    is(name) {
        return (this.name == name);
    }
}
exports.ControlValue = ControlValue;
_a = ControlValue;
ControlValue.SWITCH_VALUES = ['on', 'off'];
ControlValue.NOTIFICATION_VALUES = ['cancel', 'normal', 'alert', 'warn', 'alarm', 'emergency'];
ControlValue.CONTROL_VALUES = ['undefined'];
ControlValue.VALID_VALUES = [..._a.SWITCH_VALUES, ..._a.NOTIFICATION_VALUES, ..._a.CONTROL_VALUES];
ControlValue.cancel = new _a('cancel');
ControlValue.normal = new _a('normal');
ControlValue.alert = new _a('alert');
ControlValue.warn = new _a('warn');
ControlValue.alarm = new _a('alarm');
ControlValue.emergency = new _a('emergency');
ControlValue.on = new _a('on');
ControlValue.off = new _a('off');
ControlValue.undefined = new _a('undefined');
