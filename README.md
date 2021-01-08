# pdjr-skplugin-threshold-notifier

Raise notifications based on some path value.

__pdjr-skplugin-threshold-notifier__ compares the real-time values of
one or more keys against user-defined thresholds and raises Signal K
notifications if these limits are encountered.

## Operating principle

__pdjr-skplugin-threshold-notifier__ processes a collection of *rules*
each of which defines a *triggerpath*, a *notificationpath* and upper
and lower thresholds.

The plugin subscribes to each of the defined *triggerpath*s and
checks each incoming value against the defined thresholds.
When a value transits its upper threshold then a notification is
published on *notificationpath* using properties defined for an upper
threshold excursion.
When a value transits its lower threshold then a notification is
published on *notificationpath* using properties defined for a lower
threshold excursion.
The difference between the two notification property values can be used
by a consumer to take actions which are initiated by one excursion and
cancelled by the other - one example might be the control of a
discharge pump.

## Configuration properties

| Property name                        | Description |
|:-------------------------------------|:------------|
| __rules__                            | Array of *rule* objects, each of which defines a rule that should be processed by the plugin. |
| *rule*.__triggerpath__               | Signal K key which should be monitored. |
| *rule*.__notificationpath__          | Signal K key on which notifications should be issued when *triggerpath* value encounters a threshold. |
| *rule*.__enabled__                   | Boolean property enabling or disabling the rule. |
| *rule*.__lowthreshold__              | Definition of low threshold and associated properties. |
| *rule*.__lowthreshold__.__value__    | Low threshold value. |
| *rule*.__lowthreshold__.__message__  | Message property value for low notification (issued when trigger value < low threshold). |
| *rule*.__lowthreshold__.__state__    | State property value for low notification. |
| *rule*.__lowthreshold__.__method__   | Method property value for low notification. |
| *rule*.__highthreshold__             | Definition of high threshold and associated properties. |
| *rule*.__highthreshold__.__value__   | High threshold value. |
| *rule*.__highthreshold__.__message__ | Message property value for high notification (issued when trigger value > high threshold). |
| *rule*.__highthreshold__.__state__   | State property value for high notification. |
| *rule*.__highthreshold__.__method__  | Method property value for high notification. |

Any of the following tokens may be used in the supplied __message__
text and these will be interpolated with the described value when the
notification message is composed.

_${path}_ will be replaced by the value of __triggerpath__.

_${test}_ will be replaced by one of "above", "below" or "between"
dependant upon the threshold being crossed and the direction of
crossing.

_${threshold}_ will be replaced with the __value__ of the threshold
triggering the rule or, in the case of the path value being between
thresholds with the string "_n_ and _m_" where _n_ is the low threshold
and _m_ is the high threshold.

_${value}_ will be replaced with the instantaneous value of the
monitored path that triggered the rule.

_${vessel}_ will be replaced with Signal K's idea of the vessel name.

An example message text might be "${vessel}: ${path} is ${test}
${threshold} (currently ${value})".

## Reference configuration
```
{
  "enabled": true,
  "enableLogging": false,
  "enableDebug": false,
  "configuration": {
    "rules": [
      {
        "triggerpath": "tanks.wasteWater.0.currentLevel",
        "notificationpath": "notifications.tanks.wasteWater.0.currentLevel.override",
        "enabled": true,
        "highthreshold": {
          "value": 0.3,
          "message": "waste water level is ${comp} ${threshold}: ${action} discharge pump",
          "state": "alert",
          "method": [ "visual" ]
        },
        "lowthreshold": {
          "value": 0.05,
          "message": "waste water level is ${comp} ${threshold}: ${action} discharge pump",
          "state": "normal",
          "method": []
        }
      }
    ]
  }
}
```
