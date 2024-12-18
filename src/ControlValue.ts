export class ControlValue {

  static SWITCH_VALUES = [ 'on', 'off' ];
  static NOTIFICATION_VALUES = [ 'cancel', 'normal', 'alert', 'warn', 'alarm', 'emergency' ];
  static CONTROL_VALUES = [ 'undefined' ];
  static VALID_VALUES = [ ...this.SWITCH_VALUES, ...this.NOTIFICATION_VALUES, ...this.CONTROL_VALUES ];

  private name: string;

  static cancel = new ControlValue('cancel');
  static normal = new ControlValue('normal');
  static alert = new ControlValue('alert');
  static warn = new ControlValue('warn');
  static alarm = new ControlValue('alarm');
  static emergency = new ControlValue('emergency');
  static on = new ControlValue('on');
  static off = new ControlValue('off')
  static undefined = new ControlValue('undefined');

  constructor(name: string) {
    if (ControlValue.VALID_VALUES.includes(name)) {
      this.name = name;
    } else {
      throw new Error(`requested control value name is invalid ('${name}')`);
    }
  }

  getName(): string {
    return(this.name);
  }

  isNotification(): boolean {
    return(ControlValue.NOTIFICATION_VALUES.includes(this.name));
  }

  isSwitch(): boolean {
    return(ControlValue.SWITCH_VALUES.includes(this.name));
  }

  is(name: string) {
    return(this.name == name);
  }

}