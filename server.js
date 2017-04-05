/*
 * Author: Daniel Holmlund <daniel.w.holmlund@Intel.com>
 * Copyright (c) 2015 Intel Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// This daemon listens to all data streams, and checks for particular trigger
// conditions as needed.

// Load the application configuration file
var config = require("./config.json")

// Load NodeJS Library to interact with the filesystem
var fs = require('fs');

// A library to colorize console output
var chalk = require('chalk');

// Require MQTT and setup the connection to the broker
var mqtt = require('mqtt');

// Require the MongoDB libraries and connect to the database
var mongoose = require('mongoose');

// A modern JavaScript utility library delivering modularity, performance & extras.
var _ = require("lodash");

// A simplified HTTP request client with Promise support.
// The request-promise library will be passed to the context Object
// and made available in the triggers.
var http = require('request-promise');


// Write startup message to the console
console.log(chalk.bold.yellow("Automation server is starting"));


// Read in the server key and cert and the CA certs
try {
  var KEY = fs.readFileSync(config.tls.serverKey);
  var CERT = fs.readFileSync(config.tls.serverCrt);
  var TRUSTED_CA_LIST = [fs.readFileSync(config.tls.ca_certificates)];
} catch (err) {
  console.error(chalk.bold.red("Unable to find the TLS certs. Please see the first section of the security lab for instructions on creating TLS keys and certificates"))
  console.error(err)
  process.exit()
}

// options - an object to initialize the TLS connection settings
var options = {
  port: config.tls.port,
  host: config.tls.host,
  protocol: 'mqtts',
  protocolId: 'MQIsdp',
  keyPath: KEY,
  certPath: CERT,
  rejectUnauthorized : false,
  //The CA list will be used to determine if server is authorized
  ca: TRUSTED_CA_LIST,
  secureProtocol: 'TLSv1_method',
  protocolVersion: 3
};


// Connect to the MQTT server
var mqttClient  = mqtt.connect(options);

// Define function to respond to the 'connect' event
mqttClient.on('connect', function () {
    console.log(chalk.bold.yellow("Connected to MQTT server"));

    // Subscribe to the MQTT topics
    mqttClient.subscribe('announcements');
    mqttClient.subscribe('sensors/+/data');
});

// Define function to respond to the 'error' event
mqttClient.on('error', function () {
    console.log(chalk.bold.yellow("Unable to connect to MQTT server"));
    process.exit();
});


// Create a connection to the database
mongoose.connect(config.mongodb.url);
var db = mongoose.connection;

// Report database errors to the console
db.on('error', console.error.bind(console, 'connection error:'));

// Log when a connection is established to the MongoDB server
db.once('open', function (callback) {
    console.log(chalk.bold.yellow("Connection to MongoDB successful"));
});

// Import the Database Model Objects
var TriggerModel = require('intel-commerical-edge-network-database-models').TriggerModel;
var ErrorModel = require('intel-commerical-edge-network-database-models').ErrorModel;


// Context - An object that will be passed into each trigger condition and action
//           function.  If you want to use a library in your automation rules,
//           for example MQTT, then put it in the context object.
var context = {
    // Holds the trigger conditions and
     triggers : [],

    // Holds the last value of each sensor and makes the value available
    // to the conditions and functions
    stash : [],

    // Make the HTTP request-promise library available in automation rules
    http: http,

    // Make the MQTT library available in automation rules
    mqttClient: mqttClient,

    // Make the Chalk library available in automation rules
    chalk: chalk
};


// Fetch the Automation Rules from the Database
console.log(chalk.bold.yellow("Getting Automation Rules from the Database"));


// When the server starts, it should read the triggers from the db and store
// them the triggers array.

// Define the function that reads automation rules from the database
var retrieveTriggersFromDB = function() {
    TriggerModel
        .find().
        exec().then(function(triggersDB) {
            context.triggers = triggersDB;
            _.forEach(context.triggers,
                      function(trigger) {
                          console.log("Retrieved trigger - " + trigger.name);
                      });
        });
};

// Reads automation rules from the database once when the server starts
retrieveTriggersFromDB();

// Every time a new message is received, do the following
mqttClient.on('message', function (topic, message) {
    console.log(chalk.bold.green(topic + ":" + message.toString()));
    var json;

    // Parse incoming JSON and print an error if JSON is bad
    try {
        json = JSON.parse(message);
    } catch(error) {
        console.log("Malformated JSON received: " + message);
    }

    // If a sensor datum arrives on a MQTT topic then process it.
    if (isSensorTopic(topic)) {
        processSensorData(json);
    }
});


// filter_triggers_by_sensor_id - Takes an array of automation rules and returns
// and returns an array of automation rules that apply to a particular sensor.
var filter_triggers_by_sensor_id = function(id) {
    return _.filter(context.triggers, {sensor_id : id});
};

// filter_triggers_by_active - Takes an array of automation rules and returns
// and returns an array of automation rules that are set to active.
var filter_triggers_by_active= function(id) {
    return _.filter(context.triggers, {active : true});
};

// Predicate to determine if the message is from a sensors/<sensor_id>/data topic
var isSensorTopic = function(str) {
    return str.match(/sensors\/[A-Za-z0-9]{0,32}\/data/);
}

// processSensorData - a function that receives a sensor datum in json format
// and filters the automation rules by the sensor that the datum came from.
// It then call the automation rules condition function. If the condition
// function is TRUE, it call the eval_triggerFunc which performs the automation
// action. This function also stores the datum in the stash. If the stash had a
// previous value then it will be overwritten.
var processSensorData = function(json) {
    var sensor_id = json.sensor_id;
    var value = json.value;

    // Loop through all of the triggers for the sensor which
    // is sending this incoming sensor data.
    context.stash[sensor_id] = value;

    // Filter the automation filter rules by sensor and whether it is active
    // then pass each rule to a functions that checks the trigger predicate function
    // and call the action function if it is TRUE
    _.forEach(
        filter_triggers_by_active(
          filter_triggers_by_sensor_id(
            sensor_id
        )),

        // Check if the triggers predicate evaluates to true
        function(trigger) {
            // If a trigger is malformatted then log the error
            try {
                // Pass the context object into the evaluation of condition and action
                if (trigger.eval_condition(context, json)) {
                    console.log(chalk.bold.yellow("Trigger Fired: ") + chalk.bold.white(trigger.name) + " temperature value is " + value);
                    trigger.eval_triggerFunc(context, json);
                }
            } catch (err) {
                console.log(chalk.bold.red(err));
            }
        });

    // After the trigger is run the value used becomes the previous value
    context.stash[sensor_id+"_prev"] = value;
};
