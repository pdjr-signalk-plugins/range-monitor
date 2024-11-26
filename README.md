# pdjr-skplugin-range-notifier

Raise notifications based on value ranges.

## Description

**pdjr-skplugin-range-notifier** operates one or more user-defined
*rule*s.

Each rule specifies a Signal K *path*, a pair of *threshold*s and some
notification states.
The *threshold*s define the upper and lower limits of a value range and
the plugin will issue a notification when the *path* value enters and
leaves this defined range.

Differences between the various notification property values can be
used to signal actions: perhaps the control of a discharge pump or the
monitoring of an engine or other sensor state.

## Configuration

The plugin configuration file contains a single *Rules* array property
where each item is a *Rule* object.

<dl>
  <dt>Rule name <code>name</code></dt>
  <dd>
    <p>
    Optional string property giving a name for the rule.
    </p><p>
    Defaults to 'Innominate rule'.
    </p>
  </dd>
  <dt>Trigger path <code>triggerPath</code></dt>
  <dd>
    <p>
    Required string property specifying the Signal K key whose value
    should be monitored.
    </p>
  </dd>
  <dt>Low threshold <code>lowThreshold</code></dt>
  <dd>
    <p>
    Required number property defining the lower threshold of this
    rule's monitoring range.
    </p>
  </dd>
  <dt>High threshold <code>highThreshold</code></dt>
  <dd>
    <p>
    Required number property defining the upper threshold of this
    rule's monitoring range.
  </dd>
  <dt>Notification path <code>notificationPath</code></dt>
  <dd>
    <p>
    Optional string property which can be used to override the
    default Signal K path to which notifications will be written.
    </p><p>
    If no value is supplied then notifications will be written to
    the default path ```notifications.<em>triggerPath</em>```.</p>
    </p><p>
    If a value is supplied and it does not specify an absolute path
    in the 'notifications.' tree, then notifications will be wriiten
    to ```notifications.<em>triggerPath</em>.<em>notificationPath</em>```.
    </p><p>
    Otherwise notifications will be written to ```<em>notificationPath</em>```.
    </p>
  <dd>
  <dt>State for notification issued when value enters range <code>inRangeNotificationState</code></dt>
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
