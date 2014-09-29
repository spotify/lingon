# Lingon usage

This document describes real use cases for Lingon. It starts by covering the basics and proceeds to more advanced uses. The usage documentation is work in progress. Please help out by documenting your use cases in a PR. Thanks!

## Preface: The Lingon conventions

So far we've been talking a lot about conventions. Here they are in fairly short form:

#### Convention 1: Files are concatenated using "directives"

Common example: Our project consists of many JS files and we want to output one file with everything in it. The solution is to use "directives".

Directives are Lingon-specific commands that live in the header of certain files (js, html, ejs). The commands are hidded using the comments of the source file and look like this:

**source/app.js**
```JavaScript
//= include '../bower_components/3rdParty/index.js'
//= include '_app/myCode.js'

// This code will be appended last
var something = someFunctionFromMyCode();

```

See the "directives" section below for more details.

#### Convention 2: Paths starting with `_` are excluded

If a path starts with an underscore (such as `source/_lib/`), Lingon will ignore it. This is how you separate the source structure from the built structure. A common pattern is to have a `source/_app` directory and a `source/app.js` file that includes the app sources in some specific order using directives.

#### Convention 3: Files are processed based on their filename extensions

Processing a file means somehow transforming it. For instance, compiling LESS to CSS, or minifying a JS file. Processors are regular Gulp streams and they are registered to a file extension. This means that you for instance tell Lingon to "minify all files names *.min.js.

See the "Using gulp processors" section below for more details.

## 01 Build a basic project

One of the most basic projects imaginable looks like this:

### Project structure

There's a lingon.js file and a source directory containing an index.html file.

```
lingon.js
source
  index.html
```

#### lingon.js
```js
#!/usr/bin/env node
var lingon = require('lingon');
```

In the lingon.js file we import the lingon module. When lingon is imported it will automatically start itself after the entire lingon.js file has been executed.


#### source/index.html

The HTML file contains the following:

```html
<html>
  <body>
    <h1>Hello Lingon!</h1>
  </body>
</html>
```

### Building

In order to build this project with Lingon we first make the lingon.js file executable:

```
chmod +x lingon.js
```

Then we run the file directly and pass the 'build' task as the first argument:

```
./lingon.js build
```

The output of this command looks like:

```
$ ./lingon
[ Lingon ] Working directory: /absolute/path/to/project
[ Lingon ] source/index.html -> build/index.html
```

Lingon read the source directory and found the index.html file. It was then ouputted to ``./build/index.html``

## 02 Serve the project locally

One of the primary features of Lingon is the built in http server. It allows you to serve the project locally and view it in your browser. Refreshing will trigger a rebuild, so you can work and instantly see your changes.

To start the built in http server, run:

```
./lingon.js server
```

The server "task" is the default in Lingon, so just running `./lingon.js` will also start the server.

## 03 Using file directives

File directives are commands living in the header of files. They tell Lingon how to concatenate different files together. Directives are only parsed inside certain file types: `.js`, `.html`, `.less` and `.ejs`. The "Advanced Lingon usage" section below explains how to add additional files to parse.

* A directive must be escaped using a js, CoffeeScript or HTML style comment.
* When using JS or CoffeeScript comments, an additional `=` char is required.
* When using HTML style comments the prefix `lingon: ` must be used.

Example: index.js

```JavaScript
//= include 'some/file.js'
```

Example: index.html

```JavaScript
<!-- lingon: include 'some/file.html' -->
```

A directive must exist in the header of a file. The header is defined as the beginning of the file and until the first line that is not a comment or a whitespace.

There are two types of directives:

Name | Parameters | Description
-----|------------|------------
include | A glob path | Example globs: `'_app/index.js', '_app/*.js', '_app/**/*.js', '!_app/**/*spec.js'`
include_self | N/A | include_self is used to control where the contents of the calling file will be placed.<br>For instance if you want to include: 1. A library, 2. The file itself, 3. Another file.



## 04 Using file processors (Gulp streams)

Lingon uses Gulp.js streams to process files. Lingon already includes a few commonly used processors, but it's simple to add more. A processor is added to a file extension. For instance, I you could add a CoffeeScript processor to the '.coffee' extension by doing: 

```JavaScript 
#!/usr/bin/env node

var lingon = require('lingon');
var coffee = require('gulp-coffee');

// Register the coffee processor on the 'coffee' file extension.
// It will be executed on all *.coffee files in the source tree.
lingon.postProcessors.set('coffee', function() {
	// This function should return a new instance of a gulp stream.
	// Lingon will create a unique coffee() stream for each .coffee file.
	return coffee();
};

```

#### Two kinds of processors

In Lingon there are two types of processors:

* pre-processors: Run on each individual file _before_ concatenation
* post-processors: Run on each file written to the output path, _after_ concatenation.

#### The full processor API

Use `lingon.preProcessors` and `lingon.postProcessor` to access lingon's processors and invoke `set`, `push`, `unshift` or `remove`. The arguments are

1. a single file extension string or an array of mulitple
2. an optional regular expression that matches the file name for conditional processors (more about that in the next section)
3. a factory function that will create the stream pipes

The factory function gets passed in two configuration variables when executed: the first one is a context that is seperate for each processed file. The second one is a global one and is shared between all files/processors.
This function then returns a single (or an array of multiple) stream modifiers that will be piped one after another to their respective files.

```js
#!/usr/bin/env node
var lingon = require('lingon');
var ngHtml2js = require('lingon-ng-html2js');
var uglify = require('gulp-uglify');
var less = require('gulp-less');

// registering a new preprocessor and adding it to the end of the file type's processor chain
lingon.preProcessors.push('ngt', function(context, globals) {
  // return a single stream modifier
  return ngHtml2js({ base: 'source' });
});

// registering a new postprocessor and adding it to the beginning of the file type's processor chain
lingon.postProcessors.unshift('js', function(context, globals) {
  // return an array of stream modifiers
  return [
    uglify({ outSourceMap: true })
  ];
});

// registering a new postprocessor and overwriting any existing ones for the file type
lingon.postProcessors.set('less', function(context, globals) {
  // return an array of stream modifiers
  return [
    less()
  ];
});
```

## 05 Rewriting file extensions

An extensions rewrite is what happens when your input file "source/index.ejs" is built to "build/index.html". Lingon include sane defaults to handle the most common files (ejs, less, coffee, etc). However, you can also add your own extension rewrites using the following api: 

**Rewrite all *.fika files to *.js**
```js
var lingon = require('lingon');

lingon.rewriteExtension('fika', 'js');
```

You can also rewrite multiple extensions at the same time: 

**Rewrite all *.json.ejs files to *.json**
```js
var lingon = require('lingon');

lingon.rewriteExtension('json.ejs', 'json');
```

If you rewrite to an empty string the extension will simply disappear: 

**Remove .min from all filenames**
```js
var lingon = require('lingon');

lingon.rewriteExtension('min', '');
```

## 05 Render EJS templates

Lingon comes with out of the box support for EJS templates using the [gulp-ejs](https://github.com/rogeriopvl/gulp-ejs) module.

### Render data with EJS

The Lingon instance has a property `lingon.global` which is available in all EJS templates during rendering. The object can be accessed from all EJS templates & layouts.

**Example: lingon.js**

```js
#!/usr/bin/env node
var lingon = require('lingon');

lingon.global.name = "bob";
```

**Example: index.ejs**

```html
<html>
  <%= global.name %>
</html>
```

### File specific context

EJS templates also have access to a `context` object that contains information about the current file being processed.

Name | Description
-----|------------
file | *Path to current file being rendered*
layout | *Path to current layout (null if no layout is used)*
template | *Path to the current source file**

**"source file" refers to the file being written to the build path after partials and layouts have been included.*

The `context` object can also be extended with custom properties in a pre-processor. For example, use this to get the shasum of each file and write it in the template.

**Example: lingon.js**
```js
#!/usr/bin/env node
var lingon = require('lingon');
var es = require('event-stream');
var spawn  = require('child_process').spawn;

lingon.preProcessors.unshift('ejs', function(params) {
  // This functions takes an object of named params: 
  // params.global    The file-specific context object  
  // params.context   The global data object

  return es.map(function(file, cb) {
      var shasum = spawn('shasum', [
        params.context.file
      ]);

      shasum.stdout.on('data', function (data) {
        params.context.shasum = data.toString().trim();
      });

      shasum.on('close', function (data) {
        cb(null, file);
      });
    });
});
```

**Example: home.ejs**
```html
<div class="home">
  <h1>file: <%= context.file %></h1>
  <h2>layout: <%= context.layout %></h2>
  <h3>template: <%= context.template %></h3>
  <h4>metadata: <%= context.shasum %></h4>
</div>
```


### Different values during build & server
It's possible to pass different data to the server and build tasks by overriding data in the `serverConfigure` event. This way the title will be 'bob' during build and 'alice' when the server has started.

```js
#!/usr/bin/env node
var lingon = require('lingon');

lingon.global.name = "bob";

lingon.bind('serverConfigure', function() {
  lingon.global.name = "alice";
});
```

## 06 Configure Lingon

The Lingon configuration can be directly accessed and mofied from inside the lingon.js file via the `lingon.config` object. The  following properties are available:

Name | Description
-----|------------
defaultTask | *Task that will be run when invoking lingon without any arguments, defaults to `'server'`.*
sourcePath | *Name of the project's source folder, defaults to `'source'`.*
buildPath | *Name of the project's build folder, defaults to `'build'`.*
ignorePrefixPattern | *Pattern for ignoring files in the build process, defaults to `new RegExp('\/_')`.*
directiveFileTypes | *Registered file extensions that will be parsed for directives, defaults to `['js' 'less' 'css' 'ejs' 'html' 'md']`.*
extensionRewrites | *List of file extensions that will be converted if a postprocessor is registered for them, defaults to `{"ejs": "html", "less": "css", …}`*
server | *Is itself a config object for the built in server mode.*
server.directoryIndex | *Index file that is to be served per directory when using the server mode, defaults to `'index.html'`.*
server.catchAll | *Fallback file that is to be served if the requested one could not be found using the server mode, defaults to `undefined`.*
server.namespace | *Namespace to handle requests from a different root in server mode (e.g. `http://localhost:5678/my-namespace/index.html`), defaults to `'/'`.*

## 07 Advanced Lingon usage

#### Allowing the usage of directives (includes) in additional file types
If you want to use directives (includes) in your own custom file extensions you can just add them to the array `lingon.config.directiveFileTypes`.
By default the following file types are registered: `['js', 'less', 'css', 'ejs', 'html', 'md']`

```js
#!/usr/bin/env node
var lingon = require('lingon');

lingon.config.directiveFileTypes.push('ngt', 'coffee');
```

#### Register conditional processor

Sometimes a processor is wanted only under certain conditions so the `push` and `unshift` functions accept an optional regular expression before the factory function. Only file names that meet this regular expression will register the processor.

Additionally some processors are only needed in certain tasks, in that case we can make use of the `lingon.task` variable that contains the name of the current running task to return the array of stream modifiers.

```js
#!/usr/bin/env node
var lingon = require('lingon');
var uglify = require('gulp-uglify');

// only process files that do not contain ".min" in their name
lingon.postProcessors.push('js', /^((?!\.min).)*$/, function() {
  var processors = [];

  if(lingon.task == 'build') {
    processors.push(
      uglify({ outSourceMap: true })
    );
  }

  return processors;
});
```

#### Register tasks

Lingon uses a "task" abstraction internally in order to queue functions. A plugin developer can hook into this functionality to extend the capabilities of Lingon.

Use `lingon.registerTask('<TASKNAME>', fn, infoObject)` to register a new task. The first argument is the tasks name and it will be used when invoking it from the command line (lingon <TASKNAME>). This is followed by the task function. It gets passed in a callback argument that should be invoked after the task is done so lingon knows when to execute the next task in the queue. The last argument is an info object that will be displayed in the lingon help menu, it consists of a simple general message about the task and then lists all possible arguments with a short description.

```js
#!/usr/bin/env node
var lingon = require('lingon');
var imagemin = require('gulp-imagemin');
var pngcrush = require('imagemin-pngcrush');

// add lingon task to optimize images directly in the source folder
// execute task via "lingon imagemin"
lingon.registerTask('imagemin', function(callback) {
  lingon.config.sourcePath += '/images';
  lingon.config.buildPath = lingon.config.sourcePath;

  var optimizeImages = function(params) {
    return imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngcrush()]
    });
  };
  lingon.postProcessors.push(['jpg', 'jpeg', 'png', 'gif', 'svg'], optimizeImages);

  lingon.build(callback, null);
}, {
  message: 'Optimize images (directly in the source folder!)',
  arguments: {
    // 'v': 'Run in verbose mode' // this argument is made up for example purposes
  }
});

```
