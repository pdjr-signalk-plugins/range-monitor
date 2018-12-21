## Usage

 __signalk-threshold-notifier__ is configured through the Signal K Node server
plugin configuration interface.
Navigate to _Server_->_Plugin config_ and select the plugin tab.

Configuration is simply a matter of maintaining list of Signal K Node server
paths which the plugin should monitor and specifying the conditons under a
which notification should be raised and the attributes of the raised
notification.
On first use the monitored path list will be empty.
A new path can be added by clicking the __[+]__ button which will open an
empty configuration panel.

![Configuration panel](readme/screenshot.png)

The configuration panel consists of the following fields.

__Path__  
The Signal K Node server path which should be monitored.
There is no default value.
Enter here the full Signal K path for the sensor value which you would like to
monitor, for example, `tanks.wasteWater.0.currentValue`.

__Message__  
The text of the message which will be issued as part of any notification.

