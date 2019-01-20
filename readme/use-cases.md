## Use cases

__Automatically starting a pump when a tank level approaches full__

Have I mentioned that the black water tank on _Beatrice_ once overflowed.

My environmentally unfriendly last-ditch attempt to stop this ever happening
again (that is when I've not read the gauge, missed the alarm and ignored my
SMS warnings) is to automatically start my discharge pump if the waste tank
level becomes critical.
I use the __signalk-switchbank__ plugin to operate the pump and this requires
a notification to start the pump and a subsequent notification to stop it.
The rule I use has the following settings:
```
Monitored path:         tanks.wasteWater.0.currentLevel
Notification message:   ${vessel}: waste tank level is ${test} ${threshold} (automatic pump control is enabled)
High threshold:         0.9
Alarm state:            alert
Suggested method:       sound, on
Low threshold:          0.01
Alarm state:            normal
Suggested method:       off
```
My in-for-a-penny, in-for-a-pound approach means that I aim to start the
pump when the tank level passes the 90% threshold and stop the pump when
the level falls below 1%. 

