# Changelog

## Version 2.2.9

* Fix: Decode URI safe reqested file in server mode

## Version 2.2.8

* Fix: An empty extension (two following .) resulted in an NPE

## Version 2.2.7

* Fix: Version 2.2.6 was corrupted in NPM

## Version 2.2.6 (unpublished)

* Feature: Extended Google JS styleguide to be a bit more strict
* Fix: Follow code style for all files in `lib/` directory
* Fix: jshint/jscs were not executed on the correct folder
* Fix: directiveStream now puts comments in `.js` files only, when finding cyclic dependencies

## Version 2.2.5

* Feature: Lingon source code style follows the Google JS styleguide
* Feature: Add autoreleasing using travis-ci

## Version 2.2.4

* Feature: Add namespace to printed server address
* Fix: Set file's base path to source folder instead of parent folder

## Version 2.2.3

* Fix: Print out `localhost` instead of `0.0.0.0` server address, since it is supposed to be an unrouteable URL

## Version 2.2.2

* Fix: Symlinks are being followed again when traversing the source tree

## Version 2.2.1

* Fix: Output a clearer error message if a port conflict occurs during server startup
* Fix: URLs containing reserved keywords now work

## Version 2.2.0

* Feature: Add option to pass in complete file path to conditional processor's regexp instead of just the file name
* Refactor: Add info/error log helpers

## Version 2.1.4

* Fix: Server address in console output is clickable
* Fix: Having query strings prevented the directory index to be served

## Version 2.1.3

* Fix: Bump dependencies
* Fix: Use stderr for error messages

## Version 2.1.2

* Fix: Add clearer error message for server port collision
* Fix: Replace deprecated express res.send syntax

## Version 2.1.1

* Fix: ExtensionRewriter: The RegExp was not matching the . (dot) in an extension.

## Version 2.1.0

* Feature: Lingon.build now writes to files disk per default (again). The server is explicitly overwriting this behaviour to serve files directly over http.
* Fix: The ExtensionRewriter was not able to rewrite multiple segments: For instance "js.ejs" => "js".

## Version 2.0.0

* Feature: Add option to specify a namespace in server mode
* Feature: Add option to specify a directory index in server mode
* Feature: Add unit test framework `tape` and restructure test folders
* Refactor: Removed the processorStream built in file cache and fixed bugs in the directiveStream.
* Refactor: Rewrote the build logic as a pipeline of pluggable functions
* API change: Moved all configuration to `lingon.config`
* API change: Refactor processors (ProcessorStore) with a simplified API syntax
* API change: Files are no longer written to disk when in server mode. Only the build task will write files to disk.

## Version 1.4.0

* Feature: A new object "context" is passed into the processor factory function. This object can be used to pass file-specific metadata around. It has the following fields built in: context.file.path (the path of the current file being rendered), context.file.layout (the path to the current layout, otherwise empty)
* Because of this addition the lingon.context object will be renamed to lingon.global in an upcoming version. Both the global and the context objects are passed into the processor factory function, so it's backwards compatible.

## Version 1.3.0

* Feature: Allow unshifting of processors and not only pushing
* Feature: Added support for nested template layouts.

## Version 1.2.0

* Feature: Basic support for ejs layouts. Use a yield directive to wrap a rendered html file inside another template.

## Version 1.1.0

* Feature: Define a catch-all file to serve instead of displaying a 404 message. Useful when working with html5 History API.

## Version 1.0.4

* Bug fix: The concat plugin could corrupt the encoding of a blob file, now the plugin runs only when necessary.
* Bug fix: Prevent warning message from express dependency in server mode

## Version 1.0.3

* Bug fix: The console output was showing absolute paths in server mode. Changed it back to relative paths.

## Version 1.0.2

* Critical fix: The performance enhancement introduced a critical bug that was not caught by the test suite. Source->Build mapping did not work and filenames that were transformed were not found by the server.

## Version 1.0.1

* Performance enhancements: Optimized how Lingon searches for a single source file, when requested in server mode. Also removed some old unnecessary code that was slowing down startup time for lingon server.

## Version 1.0.0

* Feature: Inline includes in EJS/HTML files. The lingon inline directive can be used inside an inline HTML comment.
* Breaking Change in EJS rendering: The task specific "config" object has been replaced with a global "context" object. All properties put on this object will be available inside the EJS execution context.

## Version 0.9.1

* Fix: The orderedMergeStream would not properly wait for multi-file data events before processing the outgoing data queue. This lead to a race-condition that could affect the order of file concatenation.

## Version 0.9.0

* Feature: Consistent renaming of filename extensions. File extensions are being rewritten based on a map of source -> destination files. This map includes some sane defaults (less -> css, etc) but can also be extended through a new api: lingon.extensionRewriter.
* Feature: Server mode does not compile everything at startup. Instead, east request triggers a build.

## Version 0.8.2

* Fix: Race condition in processor callbacks

## Version 0.8.1

* Fix: Hide debug log statement

## Version 0.8.0

* Feature: Support for nested include directives in source files
* Improvement: Major refactor of the lingon core: Cleanup & increased readability of code.
* Improvement: More tests

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
