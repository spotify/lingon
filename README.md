# orangejuice 

A minimalistic static site generator inspired by Middleman and Sprockets, compatible with some gulp plugins.

## Overview
This project is an attempt to port some of the features of [middleman](http://middlemanapp.com) to the node.js ecosystem. If already you love middleman and Sprockets but need to use node.js, this might be interesting to you.

Orangejuice is a file based build system inspired by Sprockets. In Sprockets, files in the source tree are concatenated and transformed based on their filename. For instance, a ".scss" file is compiled as SASS and written to the output as ".css". The Sprockets lingo for this is that the file is worked on by "processors". In Orangejuice these processors are implemented using streams in a way that make them compatible with gulp plugins.

Concatenation is handled by a DSL referred to as "directives", that can be written at the top of source files. For instance: 

```
//= include '../bower_components/angular/angular.js'
//= include '../bower_components/angular-animate/angular-animate.js'
```

## Examples
_(Coming soon)_

## License
Copyright (c) 2014 Jonathan Pettersson  
Licensed under the MIT license.
