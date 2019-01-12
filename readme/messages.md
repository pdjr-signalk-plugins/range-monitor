## Messages

__signalk-threshold-notifier__ outputs the following messages to the Signal K
Node server console and the host system logs.

__Monitoring *n* path__[__s__]  
Output when the plugin initialises to report the number, *n*, of Signal K
paths that are being monitored for threshold transition events.

__Issuing *state* notifcation on *path*__   
Output when a montored value transits a threshold and a notification is about
to be issued.
*state* is set to the notification state (e.g. "alarm", "warning", and so on)
and *path* is set to the name of the Signal K path which triggered the
notification.
The message on the server console persists for a few seconds before
the normal status message is restored.
