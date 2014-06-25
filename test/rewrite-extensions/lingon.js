#!/usr/bin/env node

var lingon = require('../../lib/boot');

lingon.extensionRewriter.set("boo", "foo");

lingon.extensionRewriter.set("normal", "rewritten");
lingon.extensionRewriter.remove("normal");