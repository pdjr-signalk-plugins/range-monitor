export declare class ControlValue {
    static SWITCH_VALUES: string[];
    static NOTIFICATION_VALUES: string[];
    static CONTROL_VALUES: string[];
    static VALID_VALUES: string[];
    private name;
    static cancel: ControlValue;
    static normal: ControlValue;
    static alert: ControlValue;
    static warn: ControlValue;
    static alarm: ControlValue;
    static emergency: ControlValue;
    static on: ControlValue;
    static off: ControlValue;
    static undefined: ControlValue;
    constructor(name: string);
    getName(): string;
    isNotification(): boolean;
    isSwitch(): boolean;
    is(name: string): boolean;
}
