## Version history

### 1.0.0

Initial release.

### 2.0.0

Revised configuration file schema to allow separate notification states and
methods for each threshold transition.
This change was necessary to allow the plugin to support the notification
based switching strategy implemented by
[signalk-switchbank](https://github.com/preeve9534/signalk-switchbank)

Version 1.0.0 schema files are not compatible with this release.
After installationi of this release, execute `bash bin/upgrade.sh` to
convert any existing configuration file to the new format. 
