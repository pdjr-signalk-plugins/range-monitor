# signalk-threshold-notifier

A [Signal K Node Server](https://github.com/SignalK/signalk-server-node) plugin
which raises notifications based on the values of one or more monitored Signal
K paths.

Thanks are due to Scott Bender for his
[signalk-simple-notifications](https://github.com/sbender9/signalk-simple-notifications)
plugin which this work simply elaborates.
## System requirements

__signalk-threshold-monitor__ has no special system requirements.
## Installation

Download and install __signalk-threshold-notifier__ using the _Appstore_ link
in your Signal K Node server console.

The plugin can also be downloaded from the
[project homepage](https://github.com/preeve9534/signalk-threshold-notifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).
## Usage

 __signalk-threshold-notifier__ is configured through the Signal K Node server
plugin configuration interface.
Navigate to _Server_->_Plugin config_ and select the _Threshold notifier_ tab.

Configuration is simply a matter of maintaining list of Signal K Node server
paths which the plugin should monitor and specifying the conditons under a
which notification should be raised and the attributes of the raised
notification.
On first use the monitored path list will be empty.
A new path can be added by clicking the __[+]__ button which will open an
empty configuration panel.

![Configuration panel](readme/screenshot.png)

The configuration panel consists of the following fields.

__Enabled?__  
Whether or not the following path is being (should be)  monitored.
Default is yes (checked).
Change this to temporarily disable individual notifications rather than
permanently deleting them.

__Signal K path to monitor__  
The Signal K Node server path which should be monitored.
There is no default value.
Enter here the full Signal K path for the sensor value which you would like to
monitor, for example, `tanks.wasteWater.0.currentValue`.

__Notification message__  
The text of the message which will be issued as part of any notification.
Default is the empty string.
Enter here the text of the message you would like to be issued when the
monitored path value crosses one of the defined thresholds.
Three tokens are available which will be replaced when the message is
composed: ${test} will be replaced by either "above" or "below" (depended upon
the threshold being crossed), ${threshold} will be replaced with the value of
the threshold being crossed and ${value} will be replaced by the sensor
value at the time the alert was issues.

For examle `Waste water tank level is ${test} ${threshold} (currently ${value})`

__Threshold__

The _Threshold_ entry specifies one or two thresholds which define a value
range and the type of notification which will be issued if the monitored
path value moves outside this range.

__--> Low__  
If supplied, specifies the lower threshold for raising a notification: if
the monitored data stream falls below this value then a notification will
be issued.
The default value is undefined which means that there is no lower
thresold.

__--> High__  
If supplied, specifies the upper threshold for raising a notification: if
the monitored data stream rises above this value then a notification will
be issued.
The default value is undefined which means that there is no upper
thresold.

__--> Alarm__  
The type of notification to be raised when one or other threshold is
passed.
Default is _Alert_.

__--> Request__  
A suggestion for the alert medium to be used when this notification is
ultimately processed by some notification handler.
Default is no suggestion.

__--> Options__  
The _In-range_ option requests that a notification also be issued when the
monitored data stream re-enters the normal region after transiting one or
other threshold.
Default is not to issue the in-range notification.
Any issued notification will contain the simple message "_path_ value is
nominal" and will have a type of "Normal".
## Messages

__signalk-threshold-notifier__ outputs the following messages to the Signal K
Node server console and the host system logs.

__Monitoring _n_ path__[__s__]  
Output when the plugin initialises to report the number, _n_, of Signal K
paths that are being monitored for threshold transition events.

__Notifying on _path__
Output when the plugin issues a threshold transition notification.
The message on the server console persists for a few seconds before
the normal status message is restored.
