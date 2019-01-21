## Use cases

__Managing *Beatrice*'s waste tank__

Once upon a time the black water tank on _Beatrice_ overflowed: I had failed
to take note of the tank gauge and had no audible alarm.
I now use Signal K to implement an escalating response to waste tank filling
which might ensure that there is never a repeat of this catastrophe.

My first line of defense is to raise a notification which is picked up by my
helm annunciator and also detected by __signalk-renotifier__ which forwards
the notification to my cell phone via SMS.
```
{
    "path": "tanks.wasteWater.0.currentLevel",
    "message": "${vessel}: waste water level is ${test} ${threshold}",
    "highthreshold": {
        "value": 0.8,
        "state": "warning",
        "method": [ "visual" ]
    }
    "options": [ "enabled" ],
    "prefix": "none"
}
```

Notwithstanding this precaution, I have an end-stop strategy which should make
sure that there is never again a problem: this environmentally unfriendly
last-ditch solution automatically starts my discharge pump if the waste tank
level becomes critical.

I use the __signalk-switchbank__ plugin to operate the pump and this requires
a notification to start the pump and a subsequent notification to stop it.
The configuration file snippet for the rule I use looks like this:
```
{
    "path": "tanks.wasteWater.0.currentLevel",
    "message": "${vessel}: waste water automatic discharge: level is ${test} ${threshold} (${value})",
    "highthreshold": {
        "value": 0.9,
        "state": "alert",
        "method": [ ]
    },
    "lowthreshold": {
        "value": 0.01,
        "state": "normal",
        "method": [ ]
    },
    "options": [ "enabled" ],
    "prefix": "control."
}
```
The notification which starts the pump must have a state which is not equal to
"normal" (in this case it is "alert") and the notification which stops the
pump must have a state equal to "normal".

