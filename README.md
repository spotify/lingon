# lingon 

[![Build Status](https://travis-ci.org/jpettersson/lingon.png?branch=master)](https://travis-ci.org/jpettersson/lingon)
[![Dependency Status](https://david-dm.org/jpettersson/lingon.png)](https://david-dm.org/jpettersson/lingon)

A minimal static site generator inspired by Middleman and Sprockets, compatible with some gulp plugins. **The project is currently very experimental, use it for fun. Things will change.**

## Overview
This project is an attempt to port a subset of [middleman](http://middlemanapp.com) to the node.js ecosystem.
We are specifically targeting the features that are useful when building single page JS apps. If you already love middleman and Sprockets but want/need to use node.js, this might be interesting to you.

**Namechange**

This project was previously known as Orangejuice.<br />
It is still very much alive, but with the new shiny name: Lingon.

**Features**

* Powered by node streams & compatible with many gulp plugins
* Sprockets-like "include" directive for file concatenation
* Use Gulp plugins as Sprockets-like file processors
* Built in http server (rebuilds files on browser refresh, no flaky fs watch).
* Out of the box support for: less and ejs
* No DSL, the lingon.js file is JavaScript

## How is it different from Gulp, Grunt, X?

Lingon favors convention over configuration. For example, Grunt & Gulp provides powerful API's for building very customized build scripts. This requires you to write a bit of code everytime you want your build system to do something new. Each step in the build pipeline is carefully orchestrated so every project becomes special. This means there's a lot of copy-pasta going on when starting something new.

Lingon is inspired by Sprockets and uses a convention approach: A set of simple rules are used to determine what files to build, how to build them and where to put them. Files are processed bases on their filename extensions. 

Example: "index.html.ejs" will be run through the EJS processor. These processors are gulp plugins, which allows us to leverage a large collection of great existing plugins. If you want to teach Lingon something new, you just have to define the mapping between a file ending and a gulp plugin. That's it!

## Get it
```

# Locally in your project
``
npm install lingon # Or add lingon to your package.json file
``

```

## Configure it
Your project should have a lingon.js file which is used to configure and run Lingon.

Here's a minimal lingon.js file with comments:

```JavaScript
#!/usr/bin/env node

var lingon = require('lingon');

// The directory with your source tree, relative to the lingon.js file.
lingon.sourcePath = 'source';

// The directory you want to build to, relative to the lingon.js file.
lingon.buildPath = 'build';
```

Here's another lingon.js file that uses a gulp plugin to compile html files into the angular template cache. In this case the The files are named .html.ngt so we register the processor for the 'ngt' file ending.

```JavaScript
#!/usr/bin/env node

var lingon = require('lingon');
var html2js = require('gulp-html2js');

lingon.sourcePath = 'source';
lingon.buildPath = 'build';

lingon.preProcessor('ngt', function() {
  return html2js({
    base: 'source'
  })
});
```

## Run it

```
Make your lingon.js file executable

chmod +x lingon.js

Show help: 
./lingon.js -h

Build once and quit:
./lingon.js build

Start the server: 
./lingon.js

Start the server on a custom port:
./lingon.js server -p 1111
```

## What about examples?

We've made an Angular.js template project that builds with Lingon.<br />
It's the best reference to how Lingon works right now:

https://github.com/jpettersson/lingon-ng-template

## Test it

Run the [bats](https://github.com/sstephenson/bats) e2e tests:
```
./tests.sh
```

## License
Licensed under the MIT license.
