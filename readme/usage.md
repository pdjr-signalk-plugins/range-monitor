## Usage

 __signalk-threshold-notifier__ is configured through the Signal K Node server
plugin configuration interface.
Navigate to _Server_->_Plugin config_ and select the _Threshold notifier_ tab.

![Configuration panel](readme/screenshot.png)

Configuration of the plugin is simply a matter of maintaining the list of
__Monitored paths__ which the plugin should inspect and specifying the
conditons under which notifications should be raised and the attributes
of such notifications.

On first use the list of monitored paths will include a single, empty, entry
which should be completed.
Additional monitored paths can be added by clicking the __[+]__ button and any
existing, unwanted, paths can be deleted by clicking the __[x]__ button (both
buttons are located in the control panel to the right of the list). 

Each monitored path configuration includes the following fields.

__Enabled__  
Checkbox specifying whether or not the path should be monitored.
Default is yes (checked).
Change this to temporarily disable individual notifications rather than
permanently deleting them.

__Signal K path to monitor__  
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

_${path}_ is the value of the _Signal K path to montor_ field.

_${test}_ will be replaced by one of "above", "below" or "between"
dependant upon the threshold being crossed and the direction of crossing.

_${threshold}_ will be replaced with the value of the threshold or, in the
case of the path value being between thresholds with the string "_n_ and _m_"
where _n_ is the low threshold and _m_ is the high threshold.

_${value}_ is the instantaneous value of the monitored path that caused the

_${vessel}_ will be replaced with Signal K's idea of the vessel name.

For examle `${vessel}: ${path} is ${test} ${threshold} (currently ${value})`

__Thresholds__

Is a list of one or more threshold specifications each of which defines one or
two thresholds and the type of notification which will be issued if the
monitored path value moves across a defined threshold.
Typically, multiple threshold entries can be used to escalate the severity of
a notification as the monitored path value makes increasingly significant
excursions beyond a threshold. 

Each threshold specification has the following properties.

__--> Low__  
If supplied, specifies the lower threshold for raising a notification: if
the monitored path value falls below this value then a notification will
be issued.
The default value is undefined which means that there is no lower
thresold.

__--> High__  
If supplied, specifies the upper threshold for raising a notification: if
the monitored path value rises above this value then a notification will
be issued.
The default value is undefined which means that there is no upper
thresold.

__--> Alarm__  
The type of notification to be raised when one or other threshold is
passed.
Default is _Alert_.

__--> Options__  
The _audio_ and _visual_ checkboxes allow a suggestion to be made for thes
alert medium to be used when this notification is ultimately processed by
some notification handler.

The _normal_ option requests that a notification also be issued when the
monitored path value re-enters the 'between-thresholds' region after
transiting one or other threshold.

The defaults are to make no suggestions and not to issue an in-range
notification.
