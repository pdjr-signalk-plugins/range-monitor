## Messages

__signalk-threshold-notifier__ outputs the following messages to the Signal K
Node server console and system logging facility.

__Monitoring *n* path__[__s__]  
Output when the plugin initialises to report the number, *n*, of Signal K
paths that are being monitored for threshold transition events.

Additionally, the following messages are output just to the system logging
facility.

__{ "state": *state*, "message": *message*, "method": *method*, "timestamp": *date* }__
Output when a montored value transits a threshold and a notification is about
to be issued.
*state* is set to the notification state (e.g. "alarm", "warning", and so on),
*message* to the text of the notification message, *method* to any requested
notification methods and *date* to the date and time of notification.
