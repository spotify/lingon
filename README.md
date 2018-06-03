# lingon
![Image of Lingon berries](https://farm3.staticflickr.com/2548/3873990304_1d2bd40ebc_m.jpg)<br>

[![Build Status](https://travis-ci.org/spotify/lingon.svg?branch=master)](https://travis-ci.org/spotify/lingon)
[![Dependency Status](https://david-dm.org/spotify/lingon.svg)](https://david-dm.org/spotify/lingon)

Lingon is a performant single-page application dev tool that focuses on developer happiness.<br />
At Spotify we use Lingon to build Angular.js applications.

## Overview

Lingon is a build tool that favors [convention over configuration](http://en.wikipedia.org/wiki/Convention_over_configuration). By employing a similar file structure across your projects you can minimize the amount of build configuration you need to write and maintain. We've borrowed this idea from [middleman](http://middlemanapp.com) and Sprockets. If you already know these tools you'll feel right at home with Lingon.

Lingon allows you to enjoy the productive workflows from Middleman while leveraging an existing community of great
gulp.js plugins.

**Features**

* A convention layer on top of node.js streams, compatible with Gulp.js.
* Sprockets-like "include" directive for file concatenation
* Uses Gulp plugins as Sprockets-like file processors
* Built in development server.
* Out-of-the box support for Less, EJS & Markdown

## Get started

### 1. Install lingon CLI globally

```bash
$ npm install -g lingon-cli
```

### 2. Create a new project

Create a minimal lingon project using the CLI:
```bash
$ lingon new hello-world
```

### 3. Run Lingon server

```bash
$ cd hello-world
$ lingon

[ Lingon ] Working directory: /path/to/hello-world
[ Lingon ] http server listening on: http://localhost:5678/
```

### Project structure

Your project looks like this:

```bash
$ ls

node_modules/
source/
.gitignore
package.json
bower.json
lingon.js
README.md
LICENSE
```

Lingon is configured and run from a file called `lingon.js`. This is where you define which plugins to use and how they should interact. The most basic valid `lingon.js` file looks like this:

```JavaScript
#!/usr/bin/env node
var lingon = require("lingon");
```

This will allow Lingon to build and serve a basic web applications. By default, Lingon will look for source files in `./source` and put build files in `./build`. These defaults can be changed like this:

```JavaScript
#!/usr/bin/env node
var lingon = require("lingon");

lingon.config.sourcePath = "/some/other/path";
lingon.config.buildPath = "/dev/null";
```

Check out the [usage documentation](docs/USAGE.md) for a walkthrough of all features.

### Lingon tasks

```bash
# Generate a lingon new lingon project:
lingon new my-project # will clone https://github.com/javoire/lingon-template-minimal
lingon new my-project -t angular # will clone https://github.com/jpettersson/lingon-ng-template

# Start the server:
lingon

# Build once and quit:
lingon build

# Show version:
lingon -v

# Show help:
lingon -h

# Start the server on a custom port:
lingon server -p 1111
```

Alternatively, you can execute the `lingon.js` file directly without installing `lingon-cli`.<br>This is useful when building in Jenkins and similar.

## Documentation

### [Usage examples](docs/USAGE.md)

## Project templates

#### [Angular.js application](https://github.com/jpettersson/lingon-ng-template)

#### [Minimal](https://github.com/javoire/lingon-template-minimal)

## How does it relate to Make, Gulp, Grunt, X?

Lingon favors convention over configuration. For example, Grunt & Gulp provide powerful API's for building very customized build scripts. This requires you to write a bit of code everytime you want your build system to do something new. Each step in the build pipeline is carefully orchestrated so every project becomes special. This means there's a lot of copy-paste going on when starting something new.

Lingon is inspired by Sprockets and uses a convention approach: A set of simple rules are used to determine what files to build, how to build them and where to put them. Files are processed based on their filename extensions.

Example: `index.html.ejs` will be run through the EJS processor. These processors are gulp plugins, which allows us to leverage a large collection of great existing plugins. If you want to teach Lingon something new, you just have to define the mapping between a file ending and a gulp plugin. That's it!


## Test it

Run the [bats](https://github.com/sstephenson/bats) e2e tests:
```
$ ./tests.sh
```

## Contributions

We'd love some help!<br />
Take a look at our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License
Licensed under the Apache license.

*Lingon photo by [thriol](https://www.flickr.com/photos/thriol/3873990304/sizes/o/)*

