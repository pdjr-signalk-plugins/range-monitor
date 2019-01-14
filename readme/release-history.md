## Release history

### 1.0.0

Initial release.

### 2.0.0

A revised configuration file schema implements separate notification states
and methods for each threshold transition.
This change allows the plugin to support the notification based switching
strategy implemented by
[signalk-switchbank](https://github.com/preeve9534/signalk-switchbank).

Configuration files created by __signalk-threshold-notifier__ version 1.0.0
are not compatible with this release, but manual conversion to the new
format is trivial.

