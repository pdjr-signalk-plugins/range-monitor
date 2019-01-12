## Use cases

__1.  Issuing a notification when a tank level approaches full__

Once upon a time the black water tank on _Beatrice_ overtopped into the bilge.

Gauges and alarms obviously don't do it for me, so I now get the ship to also
send an SMS message to my cell phone when the level of waste in the tank
approaches capacity.
I use the __signalk-renotifier__ plugin to send texts from notifications and
so I need to inject a notification into the tree in order for the whole
process to hang together and the rule I use to do this has the following
settings:
```
Monitored path:         tanks.wasteWater.0.currentLevel
Notification message:   ${vessel}: waste tank level is ${test} ${threshold}
High threshold:         0.8
Alarm state:            alert
Suggested method:       visual
Options:                (none)
```
I now receive the text message "Beatrice: waste tank level is above 0.8" when
the tank level passes the 80% threshold.

__2.  Automatically starting a pump when a tank level approaches full__

Have I mentioned that the black water tank on _Beatrice_ once overflowed.

My environmentally unfriendly last-ditch attempt to stop this ever happening
again (that is when I've not read the gauge, missed the alarm and ignored the
SMS warnings) is to automatically start my discharge pump if the waste tanks
level becomes critical.
I use the __signalk-switchbank__ plugin to start the pump and this requires
an _alert_ notification to start the pump and a subsequent _normal_
notification to stop it. 
The rule I use has the following settings:
```
Monitored path:         tanks.wasteWater.0.currentLevel
Notification message:   ${vessel}: automatic waste tank discharge pump alert: tank level is ${test} ${threshold}
High threshold:         0.9
Alarm state:            alert
Suggested method:       sound
Options:                (none)
Low threshold:          0.01
Alarm state:            normal
Suggested method:       (none)
Options:                (none)
```
My in-for-a-penny, in-for-a-pound approach means that I aim to start the
pump when the tank level passes the 90% threshold and stop the pump when
the level falls below 1%. 

