# pdjr-skplugin-range-notifier

Raise notifications based on value ranges.

## Description

**pdjr-skplugin-range-notifier** operates one or more user-defined
*rule*s.

Each rule specifies a Signal K *path*, a pair of *threshold*s and some
notification states.
The *threshold*s define a range and the plugin will issue a
notification when the *path* value enters and leaves the specified
range.

Differences between the various notification property values can be
used to signal actions: perhaps the control of a discharge pump or the
monitoring of an engine or other sensor state.

## Configuration

The plugin configuration file contains a single *Rules* array property
where each item is a *Rule* object.

<dl>
  <dt>Rule name <code>name</code></dt>
  <dd>
    Optional string property giving a name for the rule.
    Defaults to 'innominate'.
  </dd>
  <dt>Monitored path <code>triggerPath</code></dt>
  <dd>
    Required string property specifying the Signal K key whose value
    should be monitored.
  </dd>
  <dt>Low threshold <code>lowThreshold</code></dt>
  <dd>
    Required number property defining the lower limit of this rule's
    range.
  </dd>
  <dt>High threshold <code>highThreshold</code></dt>
  <dd>
    Required number property defining the upper limit of this rule's
    range.
  </dd>
  <dt>Notification path <code>notificationPath</code></dt>
  <dd>
    Optional string property specifying the Signal K path to which
    notifications will be written.
    <p>
    If omitted, then the value will be computed as
    'notifications.<em>triggerPath</em>.<em>name</em>'.</p>
    <p>
    If the supplied value does not specify an absolute path in the
    'notifications.' tree, then the value will be computed as above
    except that <em>notificationPath</em> will be used instead of
    <em>name</em>.</p>
  <dd>
  <dt>Notification states <code>notificationStates</code></dt>
  <dd>
    This object specifies up to three optional notification states
    which will be applied to notifications as the value monitored on
    <em>path</em> makes transits through the defined thresholds.
    <p>
    Each property must hold one of the values 'cancel', 'normal',
    'alert', 'warn', 'alarm' or 'emergency'.</p>.
    With the exception of 'cancel' which causes deletion of any
    pre-existing notification, values cause the issuing of a
    notification with the specified state.
    <dl>
      <dt>State for notification issued when value enters range <code>inRange</code></dt>
      <dd>
        Optional.
      </dd>
      <dt>State for notification issued when value moves above <em>highThreshold</em> <code>highTransit</code></dt>
      <dd>
        Optional.
      </dd>
      <dt>State for notification issued when value moves below <em>lowThreshold</em> <code>lowTransit</code></dt>
      <dd>
        Optional.
      </dd>
      </dd>
    </dl>
  </dd>
</dl>

### Configuration example

Signal pump start when a tank reading reaches 80% and pump stop when
tank reading falls below 5%.
```
{
  "configuration": {
    "rules": [
      {
        "name": "pumpOut",
        "triggerPath": "tanks.wasteWater.0.currentLevel",
        "highThreshold": 0.8,
        "lowThreshold": 0.05,
        "notificationStates": {
          "highTransit": "alert",
          "lowTransit": "cancel"
        }
      }
    ]
  }
}
``` 
## Operation

The plugin must be configured before it can enter production.

## Author

Paul Reeve <*preeve_at_pdjr_dot_eu*>
