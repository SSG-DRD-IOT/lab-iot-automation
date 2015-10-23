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
//This daemon listens to all data streams, and checks for particular trigger
//conditions as needed.
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

var logger = require('./logger.js');

// Import the Utilities functions
var utils = require("./utils.js");

var TriggerDaemon = function (config) {
    var self = this;
    logger = logger;

    var default_config = {
        "mqtt" : {
            "uri" : "mqtt://localhost"
        },

        "mongodb" : {
            "uri" : "mongodb://localhost/iotdemo"
        },

        "debug" : {
            "level" : {
                "console" : "error",
                "file" : "error"
            }
        },

        "threshold" : {
            "temp_high" : 27,
            "temp_low" : 20,
            "sound" : 40,
            "light" : 700
        }
    };

    // Set default properties of the Trigger Daemon
    self.config = config || default_config;

    // Set default logging options
    logger.transports.file.level = self.config.debug.level.file || 'error';
    logger.transports.console.level = self.config.debug.level.console || 'error';
    logger.info("Trigger Daemon is starting...");

    // Holds the trigger conditions and functions
    self.triggers = [];

    // Holds the last value of each sensor and makes the value available
    // to the conditions and functions
    self.stash = [];

    // Connect to the MQTT server
    self.mqttClient  = mqtt.connect(self.config.mqtt.uri);

    // Connect to the MongoDB server
    self.db = mongoose.createConnection(self.config.mongodb.uri);
    //console.log(self.db);
    logger.info("Getting Triggers from the database");

    // On Server start, read the triggers from the db and store them
    // the triggers array.
    TriggerModel.find({}, function (err, triggers) {
        if (err) {
            logger.error("Error in fetching triggers from the database");
        } else {
            logger.info("Publishing new triggers from db");
            _.forEach(triggers,
                      function(triggerJSON) {
                          self.addTrigger(triggerJSON);
                      });
       	    logger.trace(self.triggers);
	}
    });

    self.close = function() {
        self.closeMQTT();
        self.closeMongoDB();
    };

    self.closeMQTT = function() {
        //  self.mqttClient.end();
    };

    self.closeMongoDB = function () {
        //  console.log("Mongoose Disconnecting");
        mongoose.disconnect();
    };

    self.addTrigger = function (triggerJSON) {
        var trigger = new TriggerModel(triggerJSON);
        self.triggers.push(trigger);
    };

    self.refreshTriggers = function() {
        logger.info("Received a message on the Refresh MQTT topic");

        TriggerModel.find({}, function (err, results) {
            console.log("In find");
            if (err) {
                logger.error("Error in fetching triggers from the database");
            } else {
                logger.info("Publishing new triggers from db");
                self.mqttClient.publish('trigger/data', JSON.stringify(results));
            }
        });
    };

    // On the start of a connection, do the following...
    self.mqttClient.on('connect', function () {
        logger.info("Connected to MQTT server");
        self.mqttClient.subscribe('trigger/refresh');
        self.mqttClient.subscribe('trigger/data');
        self.mqttClient.subscribe('sensors/+/data');
    });


    // Every time a new message is received, do the following
    self.mqttClient.on('message', function (topic, message) {
        logger.info(topic + ":" + message.toString());
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
            self.processSensorData(json);
        } else if (utils.isRefreshTopic(topic)) {
            // Received a message on the Refresh MQTT topic
            self.refreshTriggers();
        } else if (utils.isTriggerTopic(topic)) {
            // Received a message on the Trigger MQTT topic
            self.processTriggers(json);
        }
    });

    self.filter_triggers_by_sensor_id = function(id) {
        return _.filter(self.triggers, {sensor_id : id});
    };

    self.processSensorData = function(json) {
        var sensor_id = json.sensor_id;
        var value = json.value;

        // Loop through all of the triggers for the sensor which
        // is sending this incoming sensor data.
        //   logger.info("Stash: " + sensor_id + ":" + value);
        //   console.log(self.stash);
        self.stash[sensor_id] = value;

        _.forEach(
            self.filter_triggers_by_sensor_id(
                sensor_id
            ),

            // Check if the triggers predicate evaluates to true
            function(trigger) {
                if (trigger.eval_condition(self, value)) {
                    logger.info("Trigger Fired: " + trigger.name);
                    trigger.eval_triggerFunc(self);
                }
            });
    };


    self.temperature_changed_condition = function(temperature) {
        return self.stash["temperature"] != temperature;
    };

    self.too_hot_condition = function(temperature) {
        return temperature > temp_high_threshold;
    };

    self.too_cold_condition = function (temperature) {
        return temperature < temp_low_threshold;
    };

    self.temperature_ok_condition = function(temperature) {
        return temperature > temp_low_threshold && temperature <= temp_high_threshold;
    };

    self.light_on_condition = function(light) {
        return self.stash["light"] > light_threshold;
    };

    self.fan_on_condition = function(light) {
        return self.stash["sound"] > light_threshold;
    };

   self.light_off_condition = function(light) {
        return self.stash["light"] <= light_threshold;
    };

    self.fan_off_condition = function(light) {
        return self.stash["sound"] <= light_threshold;
    };

    self.heating_error_condition = function (temperature) {
        return (self.light_on_condition() && self.temperature_too_hot()) ||
            (self.fan_off_condition() && self.temperature_too_hot());
    };

    self.cooling_error_condition = function(temperature) {
        return (self.fan_on_condition() && self.temperature_too_cold()) ||
            (self.light_off_condition() && self.temperature_too_cold());
    };

    self.temperature_has_changed = function(temperature) {
        http.get('192.168.1.118:3000/lcd/text?lcdtext=' + temperature, function (err, res) {
            if (err) {
                logger.error("Unable to Post temperature to LCD");
                logger.error(err);
            }
        });
    };

    self.temperature_ok = function() {
        self.mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Ok\"}' );

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

    self.temperature_too_cold = function() {
        self.mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Cold\"}' );

        // http.get('http://lightandlamp:10010/action?deviceId=light&action=on', function (err, res) {
	//     if (err) {
        //         logger.error("Unable to turn light on");
	// 	logger.error(err);
	//     }
        // });
    };

    self.temperature_too_hot = function() {
        self.mqttClient.publish('sensors/temperature/alerts','{\"alert\" : \"Hot\"}' );

        // http.get('http://fanandsound:10010/action?deviceId=fan&action=on', function (err, res) {
	//     if (err) {
        //         logger.error("Unable to turn fan on");
	// 	logger.error(err);
	//     }
        //     logger.info("Turning fan off");
        // });
    };


    self.temperature_cooling_error = function() {
        // The LCD screen status will changed based on this MQTT alert
        logger.error("Cooling Error");
        self.mqttClient.publish('sensors/temperature/errors','{\"alert\" : \"ColdError\"}' );

        var error = new ErrorModel({ type: "ColdError", message: "The lamp has failed to run, and the temperature is too cold"});

        error.save(function(err, sensor) {
            if (err) { throw(err); }
        });
    };

    self.temperature_heating_error = function() {
        // The LCD screen status will changed based on this MQTT alert
        logger.error("Heating Error");
        self.mqttClient.publish('sensors/temperature/errors','{\"alert\" : \"HotError\"}' );
        var error = new ErrorModel({ type: "HotError", message: "The fan has failed to run"});

        error.save(function(err, sensor) {
            if (err) { throw(err); }
        });
    };

};

module.exports = TriggerDaemon;

var triggerd = new TriggerDaemon(config);
