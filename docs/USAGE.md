# Lingon usage

This document describes real use cases for Lingon. It starts by covering the basics and proceeds to more advanced uses.

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




## Build EJS templates

## Build LESS

## Deploy a build using the git:deploy plugin