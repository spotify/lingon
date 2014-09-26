# Lingon usage

This document describes real use cases for Lingon. It starts by covering the basics and proceeds to more advanced uses. The usage documentation is work in progress. Please help out by documenting your use cases in a PR. Thanks!

## Build a basic project

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

### Serve the project locally

One of the primary features of Lingon is the built in http server. It allows you to serve the project locally and view it in your browser. Refreshing will trigger a rebuild, so you can work and instantly see your changes.

To start the built in http server, run:

```
./lingon.js server
```

The server "task" is the default in Lingon, so just running `./lingon.js` will also start the server.

## The config object

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

## Render EJS templates

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

# Render templates inside layouts

EJS does not support layouts, so this feature has been added natively to Lingon. Lingon supports templates when using `ejs`, `html` or `md` documents. It's possible to mix them, for instance: a Markdown document can be rendered inside a html template.

**Limitation:** Layouts can't be rendered inside other layouts.

## Render a simple html layout

Let's render a homepage template inside an index layout.

This example has the following structure:

```
lingon.js
source
  _layouts
    index.html
  home.html
```

#### File: source/_layouts/index.html

The layout is a regular html file that defines an inline lingon yield directive. The yield directive will be replaced with the contents of the template.

**important: It needs to be on it's own line.**

```html
<html>
  <head></head>
  <body>
    <!-- lingon: yield -->
  </body>
</html>
```

#### File: source/home.html

The template uses a lingon layout directive to define a template to render inside. The path to the template can be either relative from the template file or absolute from the lingon sourcePath.

```html
<!-- lingon: layout '_layouts/index.ejs' -->
<h1>Welcome</h1>
<p>This is a website.</p>
```

## Render a md file inside a html template

Easy! Follow the above example, but change the home.html template to a Markdown document.

**File: source/home.md**

```markdown
<!-- lingon: layout '_layouts/index.ejs' -->
# Welcome

This is a website.
```

## Advanced Lingon configurations

#### Rewriting file extensions

An extensions rewrite is what happens when your input file "index.ejs" is built to "index.html". Lingon include sane defaults to handle the most common files (ejs, less, coffee, etc). However, you can also add your own extension rewrites using the following api: 

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


#### Allowing the usage of directives (includes) in additional file types
If you want to use directives (includes) in your own custom file extensions you can just add them to the array `lingon.config.directiveFileTypes`.
By default the following file types are registered: `['js', 'less', 'css', 'ejs', 'html', 'md']`

```js
#!/usr/bin/env node
var lingon = require('lingon');

lingon.config.directiveFileTypes.push('ngt', 'coffee');
```

#### Register processors

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
