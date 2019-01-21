## Messages

__signalk-threshold-notifier__ issues the following message to the Signal K
Node server console and system logging facility.

__Monitoring *n* path__[__s__]  
The plugin has initialised and is monitoring *n* Signal K paths.

Additionally, the following messages are issued just to the system logging
facility.

__cancelling notification on '*path*'__  
The monitored value has returned between the low and high thresholds and the
notification on _path_ is being removed. 

__issuing '*state*' notification on '*path*'__  
The monitored value has passed a threshold and a notification of type *state*
has been issued on *path*.
