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
