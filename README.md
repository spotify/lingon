# lingon

[![Build Status](https://travis-ci.org/jpettersson/lingon.png?branch=master)](https://travis-ci.org/jpettersson/lingon)
[![Dependency Status](https://david-dm.org/jpettersson/lingon.png)](https://david-dm.org/jpettersson/lingon)

A minimal static site generator inspired by Middleman and compatible with gulp plugins.

## Overview
Lingon is a minimal port of [middleman](http://middlemanapp.com) to the node.js ecosystem.
We are specifically targeting the features that are useful when building single page JS apps. If you already love middleman and Sprockets but want/need to use node.js, this might be interesting to you.

**Features**

* Powered by node streams & compatible with gulp plugins
* Sprockets-like "include" directive for file concatenation
* Uses Gulp plugins as Sprockets-like file processors
* Built in http server (rebuilds files on browser refresh, no flaky fs watch).
* Out-of-the box support for Less, EJS & Markdown
* No DSL - Lingon is configured using plain JavaScript

## Get it

Add "lingon" to your package.json or:
```
$ npm install lingon
```

## Prepare your project

Create a "lingon.js" file in the root of the project and make it executable: 

	$ chmod +x lingon.js

This file is used to both configure and run Lingon. This is where you define which plugins to use and how they should interact. The most basic valid "lingon.js" file looks like this:

```JavaScript
var lingon = require("lingon");
```

This will allow Lingon to build and serve a basic web applications. By default, Lingon will look for source files in `./source` and put build files in `./build`. These defaults can be changed like this: 

```JavaScript
var lingon = require("lingon");

lingon.sourcePath = "/some/other/path";
lingon.buildPath = "/dev/null";
```

Check out the [usage documentation](usage) for a walkthrough of all features.

## Run Lingon

Show help:
	
	$ ./lingon.js -h

Build once and quit:

	$ ./lingon.js build

Clean and build:

	$ ./lingon.js clean build

Start the server:
	
	$ ./lingon.js

Start the server on a custom port:
	
	$ ./lingon.js server -p 1111


## Documentation

### [Usage examples](usage)
### [API Reference]()

## Project templates

### [Angular.js application](https://github.com/jpettersson/lingon-ng-template)


## How does it relate to Make, Gulp, Grunt, X?

Lingon favors convention over configuration. For example, Grunt & Gulp provide powerful API's for building very customized build scripts. This requires you to write a bit of code everytime you want your build system to do something new. Each step in the build pipeline is carefully orchestrated so every project becomes special. This means there's a lot of copy-pasta going on when starting something new.

Lingon is inspired by Sprockets and uses a convention approach: A set of simple rules are used to determine what files to build, how to build them and where to put them. Files are processed based on their filename extensions.

Example: "index.html.ejs" will be run through the EJS processor. These processors are gulp plugins, which allows us to leverage a large collection of great existing plugins. If you want to teach Lingon something new, you just have to define the mapping between a file ending and a gulp plugin. That's it!


## Test it

Run the [bats](https://github.com/sstephenson/bats) e2e tests:
```
$ ./tests.sh
```

## License
Licensed under the MIT license.
