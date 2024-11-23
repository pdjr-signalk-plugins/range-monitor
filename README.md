# pdjr-skplugin-range-notifier

Raise notifications based on value ranges.

## Description

**pdjr-skplugin-range-notifier** operates one or more user-defined
*rule*s.

Each rule specifies a Signal K *path*, a pair of *threshold*s and some
*notification*s.
The *threshold*s define a range and the plugin will issue a
*notification*, if one is defined, when the *path* value enters and
leaves the specified range.

Differences between the various notification property values can be
used to signal actions: perhaps the control of a discharge pump or the
monitoring of an engine or other sensor state.

## Configuration

The plugin configuration file has a single property.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| rules               | (none)  | Required array of *rule* objects. |

Each *rule* object has the following properties.

| Property            | Default                     | Description |
| :------------------ | :-------------------------- | :-----------|
| triggerpath         | (none)                      | Required path which should be monitored. |
| lowthreshold        | (none)                      | Required low threshold against which *triggerpath* value should be compared. |
| highthreshold       | (none)                      | Required high threshold against which *triggerpath* value should be compared. |
| notificationpath    | notifications.*triggerpath* | Optional path on which notifications should be issued when the *triggerpath* value transits a threshold. |
| notifications       | {}                          | Optional definitions of the notifications to be raised under different comparison outcomes. |

The *notifications* object has the following properties.

| Property            | Default | Description |
| :------------------ | :------ | :-----------|
| inrange             | (none)  | Object defining the notification to be issued when *triggerpath* value enters the range between *lowthreshold* and *highthreshold*. |
| hightransit         | (none)  | Object defining the notification to be issued when *triggerpath* value makes an
excursion above *highthreshold*. |
| lowtransit          | (none)  | Object defining the notification to be issued when *triggerpath* value makes an
excursion below *lowthreshold*. |

*nominal*, *hightransit* and *lowtransit* objects have the following properties.

| Property            | Default  | Description |
| :------------------ | :------- | :-----------|
| message             | ""       | Notification message property value. |
| state               | "normal" | Notification state property value. |
| method              | []       | Notification method property value. |

Any of the following tokens may be used in the supplied *message* text
and will be interpolated with the described value when the notification
message is composed.

_${path}_ will be replaced by the value of *triggerpath*.

_${test}_ will be replaced by one of "above", "below" or "between"
dependant upon the threshold being crossed and the direction of
crossing.

_${threshold}_ will be replaced with the value of the threshold
triggering the rule or, in the case of the path value being between
thresholds with the string "_n_ and _m_" where _n_ is the low threshold
and _m_ is the high threshold.

_${value}_ will be replaced with the instantaneous value of the
path that triggered the rule.

## Operation

The plugin must be configured before it can enter production.

## Author

Paul Reeve <*preeve_at_pdjr_dot_eu*>
