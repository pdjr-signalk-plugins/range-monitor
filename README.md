# pdjr-range-monitor

**pdjr-range-monitor** is a
[Signal K](https://www.signalk.org/)
plugin which monitors the value of one or more Signal K paths, testing
each value against a range defined by upper and lower thresholds and
generating switch or notification outputs each time a monitored value
transits a threshold.

Careful selection of control values allows the plugin to perform a
range of functions in response to changing path values.

## Configuration

Configuration of the plugin involves the definition of a collection
of *rule*s, each of which specifies a *trigger path*, a pair of
*threshold*s, a *control path* and some *control values*.

### Example 1 - operate a pump when tank gets full
>{  
>  "configuration": {  
>    "type": "object",  
>    "properties": {  
>      "name": "waste-tank-pumpout",  
>      "triggerPath": "tanks.0.wasteWater.level",  
>      "highThreshold": 0.8,  
>      "lowThreshold": 0.05,
>      "controlPath": "electrical.switches.bank.12.3.state",  
>      "
}
}
}


The plugin configuration file contains a single *Rules* array property
where each item is a *Rule* object.

<dl>
  <dt>Rule name <code>name</code></dt>
  <dd>
    <p>
    Optional string property giving a name for the rule.
    </p><p>
    Defaults to 'innominate'.
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
    the path ```notifications.<em>triggerPath</em>```.</p>
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

following example 
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
