var log = require('./log');
var chalk = require('chalk');

var descriptions = {};

var minPartition = 12;
var maxPartition = 20;

function partition(str) {
  return Array(maxPartition - str.length).join(" ");
}

function printCmd(cmd, message) {
  console.log("  " + cmd + partition(cmd) + message);
}

function printArgument(arg, message) {
  console.log("  " + arg + partition(arg) + message);
}

module.exports = {
  describe: function(task, description) {
    maxPartition = minPartition + task.length;
    descriptions[task] = description;
  },
  show: function(cmd, task) {
    log("Usage:");
    console.log("");

    if(!task) {
      for(var key in descriptions) {
        printCmd(cmd + " " + key, descriptions[key].message);
      }
    }else{
      printCmd(cmd + " " + task, descriptions[task].message);

      var padding = Array(cmd.length + 2).join(" ");

      for(var arg in descriptions[task].arguments) {
        printArgument(padding + "-" + arg, descriptions[task].arguments[arg]);
      }
    }
    console.log("");
    console.log("  Run '" + cmd + " [task] -h' to show arguments");
    console.log("");
  }
};