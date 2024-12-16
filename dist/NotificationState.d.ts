export declare class NotificationState {
    private name;
    static cancel: NotificationState;
    static normal: NotificationState;
    static alert: NotificationState;
    static warn: NotificationState;
    static alarm: NotificationState;
    static emergency: NotificationState;
    static undefined: NotificationState;
    constructor(name: string);
    getName(): string;
}
