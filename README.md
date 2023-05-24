# pdjr-skplugin-threshold-notifier

Raise notifications based on path values.

## Description

**pdjr-skplugin-threshold-notifier** operates one or more user-defined
*rule*s.
Each rule specifies a Signal K path *value*, a pair of *threshold*s
and up to three *notification* specifications.
The *threshold*s define a 'nominal' range and the plugin will issue
a *notification*, if one is defined, when *value* enters the nominal
range and when it makes an excursion through a threshold.

Differences between the various notification property values can be
used to signal actions: perhaps the control of a discharge pump or the
monitoring of an engine or other sensor state.

## Configuration (schema version 3)

The plugin configuration file has two required properties.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| version             | "3.0.0" | The configuration file schema version. |
| rules               | []      | Array of rule definition objects.

Each *rule* definition object has the following properties.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| triggerpath         | (none)  | Path which should be monitored. |
| notificationpath    | (none)  | Path on which notifications should be issued when the *triggerpath* value transits a threshold. |
| enabled             | true    | Boolean property enabling or disabling the rule. |
| lowthreshold        | (none)  | The low threshold against which *triggerpath* value should be compared. |
| highthreshold       | (none)  | The high threshold against which *triggerpath* value should be compared. |
| notifications       | {}      | Definition of the types of notification to be raised under different comparison outcomes. |

The *notifications* object has the following optional object
properties.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| nominal             | (none)  | Object defining a notification that will be issued when *triggerpath* value enters the range between *lowthreshold* and *highthreshold*. |
| hightransit         | (none)  | Object defining a notification that will be issued when *triggerpath* value makes an
excursion above *highthreshold*. |
| lowtransit          | (none)  | Object defining a notification that will be issued when *triggerpath* value makes an
excursion below *lowthreshold*. |

*nominal*, *hightransit* and *lowtransit* objects have the following properties.

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

## Author

Paul Reeve <*preeve_at_pdjr_dot_eu*>
