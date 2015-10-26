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
var mqtt = require('mqtt');
var mongoose = require('mongoose');
var http = require('http-request');
var _ = require("lodash"); //Library needed for data paring work.
var config = require("./config.json"); //Configuration information

var sound_threshold = config.threshold.sound;
var light_threshold = config.threshold.light;
var temp_high_threshold = config.threshold.temp_high;
var temp_low_threshold = config.threshold.temp_low;

// Import the Database Model Objects
var TriggerModel = require('intel-commerical-edge-network-database-models').TriggerModel;
var ErrorModel = require('intel-commerical-edge-network-database-models').ErrorModel;

// Import the logger
var logger = require('./logger.js');

// Import the Utilities functions
var utils = require("./utils.js");

// Set default logging options
logger.transports.file.level = config.debug.level.file || 'trace';
logger.transports.console.level = config.debug.level.console || 'trace';
console.log(logger.transports.console.level);
logger.info("Trigger Daemon is starting...");

var context = {
    // Holds the trigger conditions and
     triggers : [],

    // Holds the last value of each sensor and makes the value available
    // to the conditions and functions
    stash : []
};

// Connect to the MQTT server
var mqttClient  = mqtt.connect(config.mqtt.uri);

// Connect to the MongoDB server
mongoose.connect(config.mongodb.uri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connection to MongoDB successful");
});

// Fetch the Business Rules from the Database
logger.info("Getting Triggers from the database");

// On Server start, read the triggers from the db and store them
// the triggers array.

var retrieveTriggersFromDB = function() {
    logger.info("Received a message on the Refresh MQTT topic");

    TriggerModel
        .find().
        exec().then(function(triggersDB) {
            logger.info("Retrieving triggers from db");
            context.triggers = triggersDB;
            _.forEach(context.triggers,
                      function(trigger) {
                          logger.trace("Retrieved trigger - " + trigger.name);
                      });
        });
};

retrieveTriggersFromDB();

// On the start of a connection, do the following...
mqttClient.on('connect', function () {
    logger.info("Connected to MQTT server");
    mqttClient.subscribe('triggers/refresh');
    mqttClient.subscribe('sensors/+/data');
});

// Every time a new message is received, do the following
mqttClient.on('message', function (topic, message) {
    logger.trace(topic + ":" + message.toString());
    var json;

    // Parse incoming JSON and print an error if JSON is bad
    try {
        json = JSON.parse(message);
    } catch(error) {
        logger.error("Malformated JSON received: " + message);
    }

    // Determine which topic Command Dispatcher
    if (utils.isSensorTopic(topic)) {
        // Received a message on a Sensor MQTT topic
        processSensorData(json);
    } else if (utils.isRefreshTopic(topic)) {
        // Received a message on the Refresh MQTT topic
        retrieveTriggersFromDB();
    }
});

var filter_triggers_by_sensor_id = function(id) {
    return _.filter(context.triggers, {sensor_id : id});
};

var processSensorData = function(json) {
    var sensor_id = json.sensor_id;
    var value = json.value;

    // Loop through all of the triggers for the sensor which
    // is sending this incoming sensor data.
    context.stash[sensor_id] = value;

    _.forEach(
        filter_triggers_by_sensor_id(
            sensor_id
        ),

        // Check if the triggers predicate evaluates to true
        function(trigger) {
            if (trigger.eval_condition(context, value)) {
                logger.info("Trigger Fired: " + trigger.name);
                trigger.eval_triggerFunc(context);
            }
        });
};


context.temperature_changed_condition = function(temperature) {
    return this.stash["temperature"] != temperature;
};

context.too_hot_condition = function(temperature) {
    return temperature > temp_high_threshold;
};

context.too_cold_condition = function (temperature) {
    return temperature < temp_low_threshold;
};

context.temperature_ok_condition = function(temperature) {
    return temperature > temp_low_threshold && temperature <= temp_high_threshold;
};

context.light_on_condition = function(light) {
    return stash["light"] > light_threshold;
};

context.fan_on_condition = function(light) {
    return stash["sound"] > light_threshold;
};

context.light_off_condition = function(light) {
    return stash["light"] <= light_threshold;
};

context.fan_off_condition = function(light) {
    return stash["sound"] <= light_threshold;
};

context.heating_error_condition = function (temperature) {
    return (light_on_condition() && temperature_too_hot()) ||
        (fan_off_condition() && temperature_too_hot());
};

context.cooling_error_condition = function(temperature) {
    return (fan_on_condition() && temperature_too_cold()) ||
        (light_off_condition() && temperature_too_cold());
};

context.temperature_has_changed = function(temperature) {
    http.get('192.168.1.118:3000/lcd/text?lcdtext=' + temperature, function (err, res) {
        if (err) {
            logger.error("Unable to Post temperature to LCD");
            logger.error(err);
        }
    });
};

context.temperature_ok = function() {
    mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Ok\"}' );

    // http.get('http://fanandsound:10010/action?deviceId=fan&action=off', function (err, res) {
    //     if (err) {
    //         logger.error("Unable to turn fan off");
    // 	logger.error(err);
    //     }
    // });


    // http.get('http://lightandlamp:10010/action?deviceId=light&action=off', function (err, res) {
    //     if (err) {
    //         logger.error("Unable to turn light off");
    // 	logger.error(err);
    //     }
    // });
};

context.temperature_too_cold = function() {
    mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Cold\"}' );

    // http.get('http://lightandlamp:10010/action?deviceId=light&action=on', function (err, res) {
    //     if (err) {
    //         logger.error("Unable to turn light on");
    // 	logger.error(err);
    //     }
    // });
};

context.temperature_too_hot = function() {
    mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Hot\"}' );

    // http.get('http://fanandsound:10010/action?deviceId=fan&action=on', function (err, res) {
    //     if (err) {
    //         logger.error("Unable to turn fan on");
    // 	logger.error(err);
    //     }
    //     logger.info("Turning fan off");
    // });
};


context.temperature_cooling_error = function() {
    // The LCD screen status will changed based on this MQTT alert
    logger.error("Cooling Error");
    mqttClient.publish('sensors/temperature/errors','{\"alert\" : \"ColdError\"}' );

    var error = new ErrorModel({ type: "ColdError", message: "The lamp has failed to run, and the temperature is too cold"});

    error.save(function(err, sensor) {
        if (err) { throw(err); }
    });
};

context.temperature_heating_error = function() {
    // The LCD screen status will changed based on this MQTT alert
    logger.error("Heating Error");
    mqttClient.publish('sensors/temperature/errors','{\"alert\" : \"HotError\"}' );
    var error = new ErrorModel({ type: "HotError", message: "The fan has failed to run"});

    error.save(function(err, sensor) {
        if (err) { throw(err); }
    });
};
