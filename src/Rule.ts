import { NotificationState } from './NotificationState';
import { ValueClass } from './ValueClass';

export class Rule {

  public name: string = '';
  public triggerPath: string = '';
  public lowThreshold: number = 0;
  public highThreshold: number = 0;
  public notificationPath: string = '';
  public inRangeNotificationState: NotificationState = NotificationState.undefined;
  public lowTransitNotificationState: NotificationState = NotificationState.undefined;
  public highTransitNotificationState: NotificationState = NotificationState.undefined;
  public lastNotificationState: NotificationState = NotificationState.undefined;


  constructor(options: any) {
    if (!options.triggerPath) throw new Error('missing \'triggerPath\' property');
    if (!options.lowThreshold) throw new Error('missing \'lowThreshold\' property');
    if (!options.highThreshold) throw new Error('missing \'highThreshold\' property');

    this.name = options.name || 'innominate';
    this.triggerPath = options.triggerPath;
    this.notificationPath = options.notificationPath || `notifications.${options.triggerPath}`;
    this.lowThreshold = options.lowThreshold;
    this.highThreshold = options.highThreshold;
    this.inRangeNotificationState = (options.inRangeNotificationState)?new NotificationState(options.inRangeNotificationState):NotificationState.undefined,
    this.lowTransitNotificationState = (options.lowTransitNotificationState)?new NotificationState(options.lowTransitNotificationState):NotificationState.undefined,
    this.highTransitNotificationState = (options.highTransitNotificationState)?new NotificationState(options.highTransitNotificationState):NotificationState.undefined,
    this.lastNotificationState = NotificationState.undefined;
  }

  getNotificationState(valueClass: ValueClass): NotificationState {
    switch (valueClass) {
      case ValueClass.inrange: return(this.inRangeNotificationState);
      case ValueClass.low: return(this.lowTransitNotificationState);
      case ValueClass.high: return(this.highTransitNotificationState);
      case ValueClass.last: return(this.lastNotificationState);
    }
    return(NotificationState.undefined);
  }

}
