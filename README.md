# orangejuice 

A minimal static site generator inspired by Middleman and Sprockets, compatible with some gulp plugins.

## Overview
This project is an attempt to port a subset of [middleman](http://middlemanapp.com) to the node.js ecosystem.
We are specifically targeting the features that are useful when building single page JS apps. <br />

If you already love middleman and Sprockets but want/need to use node.js, this might be interesting to you.

*"Orangejuice"* because gulp and you know, it's healthy and tasty.


**Features**

* Powered by node.js streams & compatible with many gulp plugins
* Sprockets-like "include" directive for file concatenation
* Use Gulp plugins as Sprockets-like file processors.
* Built in http server (rebuilds files on browser refresh, no flaky fs watch).
* Out of the box support for: less and ejs
* No DSL BS, the ojfile is JavaScript

The project is currently very experimental, use it for fun. Things will change.

## Get it
```
npm install orangejuice
```

## Configure it
Your project should have a so called "ojfile.js" which is used to configure and run Orangejuice.

Here's a minimal ojfile with comments:

```JavaScript
#! /usr/bin/env node

var oj = require('orangejuice');

// The directory with your source tree, relative to the ojfile.
oj.sourcePath = 'source';

// The directory you want to build to, relative to the ojfile.
oj.buildPath = 'build';
```

Here's another ojfile that uses a gulp plugin to compile html files into the angular template cache. In this case the The files are named .html.ngt so we register the processor for the 'ngt' file ending.

```JavaScript
#! /usr/bin/env node

var oj = require('orangejuice');
var html2js = require('gulp-html2js')

oj.sourcePath = 'source';
oj.buildPath = 'build';

oj.preProcessors['ngt'] = function() {
  return {
    name: 'gulp-html2js',
    stream: html2js({
      base: 'source'
    })
  }
};
```

## Run it

Make your ojfile.js executable:
```
Start the server: 
./ojfile.js

Start the server on a custom port:
./ojfile.js server -p 1111

Build once and quit:
./ojfile.js build
```

## What about examples?

I've made an Angular.js template project that builds with Orangejuice.<br />
It's the best reference to how Orangejuice works right now:

https://github.com/jpettersson/orangejuice-ng-template

## License
Copyright (c) 2014 Jonathan Pettersson  
Licensed under the MIT license.
