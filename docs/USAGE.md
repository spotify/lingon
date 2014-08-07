# Lingon usage

This document describes real use cases for Lingon. It starts by covering the basics and proceeds to more advanced uses. The usage documentation is work in progress. Please help out by documenting your use cases in a PR. Thanks!

## Build a basic project

One of the most basic projects imaginable looks like this: 

### Project structure

There's a lingon.js file and a source directory containing an index.html file.

	lingon.js
	source
		index.html

#### lingon.js
```JavaScript
var lingon = require('lingon');
```

In the lingon.js file we import the lingon module. When lingon is imported it will automatically start itself after the entire lingon.js file has been executed.


#### source/index.html

The HTML file contains the following: 

```HTML
<html>
  <body>
    <h1>Hello Lingon!</h1>
  </body>
</html>
```

### Building

In order to build this project with Lingon we first make the lingon.js file executable:

	chmod +x lingon.js

Then we run the file directly and pass the 'build' task as the first argument:

	./lingon.js build

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

	./lingon.js server

The server "task" is the default in Lingon, so just running ``./lingon.js`` will also start the server.

## Render EJS templates

Lingon comes with out of the box support for EJS templates using the [gulp-ejs](https://github.com/rogeriopvl/gulp-ejs) module. 

Lingon can forward a "context" object to the EJS renderer that allows you to pass dynamic data to the ejs templates. All fields on the context object will be available for all templates during build.

**Example: lingon.js**

```JavaScript
var lingon = require('lingon');
lingon.context.name = "bob";

```

**Example: index.ejs**

```html
<html>
  <%= name %>
</html>
```

#### Different values during build & server
It's possible to pass different data to the server and build tasks by overriding data in the `serverConfigure` event. This way the title will be 'bob' during build and 'alice' when the server has started.

```JavaScript
var lingon = require('../../lib/boot');

lingon.context.name = "bob";

lingon.bind('serverConfigure', function() {
  lingon.context.name = "alice";
});

```