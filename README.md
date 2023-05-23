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

The position of a value relative to its thresholds (i.e. above, below
or between) results in an appropriate notification being published on
*notificationpath* using properties defined by the user.

Differences between the two various notification property values can be
used by a consumer to take actions which are initiated by one excursion
and cancelled by the other - one example might be the control of a
discharge pump.

## Configuration

The plugin configuration file consists of a single *rules* array
property consisting of zero or more threshold *rule* objects.

Each *rule* object has the following properties.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| triggerpath         | (none)  | Path which should be monitored. |
| notificationpath    | (none)  | Path on which notifications should be issued when the *triggerpath* value transits a threshold. |
| enabled             | true    | Boolean property enabling or disabling the rule. |
| lowthreshold        | (none)  | The low threshold against which *triggerpath* value should be compared. |
| highthreshold       | (none)  | The high threshold against which *triggerpath* value should be compared. |
| notifications       | {}      | Definition of the types of notification to be raised under different comparison outcomes. |

The *notifications* object may contain up to three object properties
each of which defines a notification which will be issued when the
*triggerpath* value is compared to *lowthreshold* and *highthreshold*.

The **nominal** object will be applied when *value* falls between
*lowthreshold* and *highthreshold*.
The **hightransit** object will be applied when *value* makes an
excursion above *highthreshold*.
The **lowtransit** object will be applied when *value* makes an
excursion below *lowthreshold*.

Each object property in *notifications* has the following properties. 

| Property            | Default  | Description |
| :------------------ | :------- | :-----------|
| message             | ""       | Notification message value. |
| state               | "normal" | Notification state property value. |
| method              | []       | Notification method property value. |

Any of the following tokens may be used in the supplied *message* text
and will be interpolated with the described value when the notification
message is composed.

_${path}_ will be replaced by the value of *triggerpath*.

_${test}_ will be replaced by one of "above", "below" or "between"
dependant upon the threshold being crossed and the direction of
crossing.

_${threshold}_ will be replaced with the __value__ of the threshold
triggering the rule or, in the case of the path value being between
thresholds with the string "_n_ and _m_" where _n_ is the low threshold
and _m_ is the high threshold.

_${value}_ will be replaced with the instantaneous value of the
monitored path that triggered the rule.

An example message text might be:
```
"${path} is ${test} ${threshold} (currently ${value})"
```

## Reference configuration
```
{
  "enabled": true,
  "enableLogging": false,
  "enableDebug": false,
  "configuration": {
    "rules": [
      {
        "enabled": true,
        "triggerpath": "tanks.wasteWater.0.currentLevel",
        "notificationpath": "notifications.tanks.wasteWater.0.currentLevel.override",
        "highthreshold": 0.5,
        "lowthreshold": 0.05,
        "notifications": {
          "hightransit": {
            "message": "waste water level is ${comp} ${threshold}",
            "state": "alert",
            "method": []
          },
          "lowtransit": {
            "message": "waste water level is ${comp} ${threshold}",
            "state": "normal",
            "method": []
          }
        }
      }
    ]
  }
}
```
