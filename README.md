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

The project is currently very experimental, use it for fun.

## Get it
```
npm install orangejuice
```

## Configure it
Your project should have a so called "ojfile.js" which is used to configure and run Orangejuice.

Here's a minimal ojfile with comments:

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

## Examples

Take a look at my Angular.js project template, built with Orangejuice:
https://github.com/jpettersson/orangejuice-ng-template

## License
Copyright (c) 2014 Jonathan Pettersson  
Licensed under the MIT license.
