# signalk-threshold-notifier

[Signal K Node Server](https://github.com/SignalK/signalk-server-node) plugin
which raises notifications based on one or more path values.

The real-time values of one or more user-specified paths are compared against
user-defined thresholds and Signal K notifications raised as these boundaries
are encountered. 

Thanks are due to Scott Bender for his
[signalk-simple-notifications](https://github.com/sbender9/signalk-simple-notifications)
plugin which this work simply elaborates.
## System requirements

__signalk-threshold-notifier__ has no special system requirements.
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

![Configuration panel](readme/config.png)

Configuration of the plugin is a matter of maintaining the list of _Rule_s
which define the plugin's action.
Each rule specifies the Signal K paths which sould be monitored, the values
which define the thresholds against which notifications should be raised and
the attributes of such notifications.

On first use the list of monitored paths will include a single, empty, entry
which should be completed.
Additional _Rule_s can be added by clicking the __[+]__ button and any
existing, unwanted, _Rule_s can be deleted by clicking the __[x]__ buttons,
both located in the control panel to the right of the list. 

Each _Rule_ includes the following fields.

__Monitored path__  
The Signal K Node server path which should be monitored.
An entry is required and there is no default value.
Enter here the full Signal K path for the value which you would like to
monitor, for example, `tanks.wasteWater.0.currentValue`.

__Notification message__  
The text of the message which will be issued as part of any notification.
Default is a simple message.
Enter here the text of the message you would like to be issued when the
monitored path value crosses one of the defined thresholds.
If any of the following tokens are used they will be interpolated when the
notification message is composed:

_${path}_ is the value of the _Monitored path_ field.

_${test}_ will be replaced by one of "above", "below" or "between"
dependant upon the threshold being crossed and the direction of crossing.

_${threshold}_ will be replaced with the value of the threshold or, in the
case of the path value being between thresholds with the string "_n_ and _m_"
where _n_ is the low threshold and _m_ is the high threshold.

_${value}_ is the instantaneous value of the monitored path that triggered
the rule.

_${vessel}_ will be replaced with Signal K's idea of the vessel name.

For examle `${vessel}: ${path} is ${test} ${threshold} (currently ${value})`

__Low threshold__ 
If supplied, a numerical value which sets a lower threshold.
If the path value falls below this value then a notification of the type
specified by the associated options will be issued.
Depending upon option settings, a notification may also be issued when the
path value returns above the threshold.

__Alarm state__
When a notification is issued, the notification _state_ property will be set
to the chosen level.
Default is to set the notification state to "alert".

__Suggested method__
When a notification is issued, the notification _method_ property will be
set to any selected value.
Default is to not suggest a notification method.

__Options__  

The _two-way_ option causes a notification with state "normal" to be issued
when the path value returns above the specified threshold.

A __High threshold__ can be defined in a similar way.
## Use cases

__1.  Issuing a notification when a tank level approaches full__

Once upon a time the black water tank on _Beatrice_ overtopped into the bilge.

Gauges and alarms obviously don't do it for me, so I now get the ship to also
send an SMS message to my cell phone when the level of waste in the tank
approaches capacity.
I use the __signalk-renotifier__ plugin to send texts from notifications and
so I need to inject a notification into the tree in order for the whole
process to hang together and the rule I use to do this has the following
settings:

Monitored path:         tanks.wasteWater.0.currentLevel
Notification message:   ${vessel}: waste tank level is ${test} ${threshold}
High threshold:         0.8
Alarm state:            alert
Suggested method:       visual
Options:                (none)

I now receive the text message "Beatrice: waste tank level is above 0.8" when
the tank level passes the 80% threshold.

__2.  Automatically starting a pump when a tank level approaches full__

Have I mentioned that the black water tank on _Beatrice_ once overflowed.

My environmentally unfriendly last-ditch attempt to stop this ever happening
again (that is when I've not read the gauge, missed the alarm and ignored the
SMS warnings) is to automatically start my discharge pump if the waste tanks
level becomes critical.
I use the __signalk-switchbank__ plugin to start the pump and this requires
an _alert_ notification to start the pump and a subsequent _normal_
notification to stop it. 
The rule I use has the following settings:

Monitored path:         tanks.wasteWater.0.currentLevel
Notification message:   ${vessel}: automatic waste tank discharge pump alert: tank level is ${test} ${threshold}
High threshold:         0.9
Alarm state:            alert
Suggested method:       sound
Options:                (none)
Low threshold:          0.01
Alarm state:            normal
Suggested method:       sound
Options:                (none)

My in-for-a-penny, in-for-a-pound approach means that I aim to start the
pump when the tank level passes the 90% threshold and stop the pump when
the level falls below 1%. 

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
