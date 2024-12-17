import { NotificationState } from './NotificationState';
import { ValueClass } from './ValueClass';
export declare class Rule {
    name: string;
    triggerPath: string;
    lowThreshold: number;
    highThreshold: number;
    notificationPath: string;
    inRangeNotificationState: NotificationState;
    lowTransitNotificationState: NotificationState;
    highTransitNotificationState: NotificationState;
    lastNotificationState: NotificationState;
    constructor(options: any);
    getNotificationState(valueClass: ValueClass): NotificationState;
}
