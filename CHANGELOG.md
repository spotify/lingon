# Changelog

## Version 0.7.0

* Feature: Tasks can now be chained
* Feature: Introduced new `clean` task
* Feature: Display an error message when streams throw an exception instead of killing the process
* Feature: Plugins can insert their own express middlewares and modify the server output
* Fix: Ensure that plugin's file operations still work after a lingon include ([#16](https://github.com/jpettersson/lingon/issues/16))
* Fix: Use more reliable event manager ([#34](https://github.com/jpettersson/lingon/issues/34))
* Some general cleanup

## Version 0.6.1

* Fix: Prevent error when tasks don't register help messages

## Version 0.6.0

* Feature: Add method to register path-matching processors (The processor will only be run if the file path matches the given regular expression)

## Version 0.5.3

* Fix: Bugfixes around how the -v flag is handled by lingon-cli and lingon

## Version 0.5.2

* Removed the lingon binary from this project and moved it to the lingon-cli package

## Version 0.5.1

* Feature: Display lingon version with: `lingon version`
* Feature: Improvements to the help command

## Version 0.5.0

* Feature: The lingon command can now be installed globally with npm install -g lingon.
* Feature: `lingon -h` provides help and a list of supported arguments.
* Feature: Plugins can provide help messages for the tasks they define.

## Version 0.4.0

* Renamed project to Lingon and deprecated the old orangejuice npm package.
