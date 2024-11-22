export class NotificationState {

  private name: string;

  static cancel = new NotificationState('cancel')
  static normal = new NotificationState('normal')
  static alert = new NotificationState('alert')
  static warn = new NotificationState('warn')
  static alarm = new NotificationState('alarm')
  static emergency = new NotificationState('emergency')

  constructor(name: string) {
    this.name = name
  }

  getName(): string {
    return(this.name)
  }

}