# orangejuice 

[![Build Status](https://travis-ci.org/jpettersson/orangejuice.png?branch=master)](https://travis-ci.org/jpettersson/orangejuice)
[![Dependency Status](https://david-dm.org/jpettersson/orangejuice.png)](https://david-dm.org/jpettersson/orangejuice)

A minimal static site generator inspired by Middleman and Sprockets, compatible with some gulp plugins. **The project is currently very experimental, use it for fun. Things will change.**

## Overview
This project is an attempt to port a subset of [middleman](http://middlemanapp.com) to the node.js ecosystem.
We are specifically targeting the features that are useful when building single page JS apps. <br />

If you already love middleman and Sprockets but want/need to use node.js, this might be interesting to you.

The name *"Orangejuice"* because of gulp and you know, it's healthy and tasty.

**Features**

* Powered by node streams & compatible with many gulp plugins
* Sprockets-like "include" directive for file concatenation
* Use Gulp plugins as Sprockets-like file processors
* Built in http server (rebuilds files on browser refresh, no flaky fs watch).
* Out of the box support for: less and ejs
* No DSL, the ojfile is JavaScript

## How is it different from Gulp, Grunt, X?

Orangejuice favors convention over configuration. For example, Grunt & Gulp provides powerful API's for building very customized build scripts. This requires you to write a bit of code everytime you want your build system to do something new. Each step in the build pipeline is carefully orchestrated so every project becomes special. This means there's a lot of copy-pasta going on when starting something new.

Orangejuice is inspired by Sprockets and uses a convention approach: A set of simple rules are used to determine what files to build, how to build them and where to put them. Files are processed bases on their filename extensions. 

Example: "index.html.ejs" will be run through the EJS processor. These processors are gulp plugins, which allows us to leverage a large collection of great existing plugins. If you want to teach Orangejuice something new, you just have to define the mapping between a file ending and a gulp plugin. That's it!

## Get it
```
npm install orangejuice
```

## Configure it
Your project should have a so called "ojfile.js" which is used to configure and run Orangejuice.

Here's a minimal ojfile with comments:

```JavaScript
#!/usr/bin/env node

var oj = require('orangejuice');

// The directory with your source tree, relative to the ojfile.
oj.sourcePath = 'source';

// The directory you want to build to, relative to the ojfile.
oj.buildPath = 'build';
```

Here's another ojfile that uses a gulp plugin to compile html files into the angular template cache. In this case the The files are named .html.ngt so we register the processor for the 'ngt' file ending.

```JavaScript
#!/usr/bin/env node

var oj = require('orangejuice');
var html2js = require('gulp-html2js');

oj.sourcePath = 'source';
oj.buildPath = 'build';

oj.preProcessor('ngt', function() {
  return html2js({
    base: 'source'
  })
});
```

## Run it

Make your ojfile.js executable:
```
chmod +x ojfile.js
```

```
Build once and quit:
./ojfile.js build

Start the server: 
./ojfile.js

Start the server on a custom port:
./ojfile.js server -p 1111
```

## What about examples?

We've made an Angular.js template project that builds with Orangejuice.<br />
It's the best reference to how Orangejuice works right now:

https://github.com/jpettersson/orangejuice-ng-template

## Test it

Run the [bats](https://github.com/sstephenson/bats) e2e tests:
```
./tests.sh
```

## Maintainers

* Jonathan Pettersson ( [jpettersson](http://github.com/jpettersson) )
* Philip von Bargen ( [philipvonbargen](http://github.com/philipvonbargen) )
* Jonatan Dahl ( [javoire](http://github.com/javoire) )

## License
Licensed under the MIT license.
