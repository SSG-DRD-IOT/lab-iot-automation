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
var mongoose = require('mongoose');
var _ = require('lodash');
var config = require('../config.json');

mongoose.connect(config.mongodb.uri);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connection to MongoDB successful");
});

// Import the Database Model Objects
//var DataModel = require('intel-commerical-iot-database-models').DataModel;
//var SensorCloudModel = require('intel-commerical-iot-database-models').SensorCloudModel;
var TriggerModel = require('intel-commerical-iot-database-models').TriggerModel;
var SensorModel = require('intel-commerical-iot-database-models').SensorModel;
var ActuatorModel = require('intel-commerical-iot-database-models').ActuatorModel;

var actuators = [
    {
        "id": "fan",
        "ipaddress": "http://192.168.1.194:10010",
        "name": "fan",
        "description": "Decreases the temperature",
        "active": "true",
        "ioType": "digital"
    },
    {
        "id": "light",
        "ipaddress": "http://192.168.1.113:10010",
        "name": "light",
        "description": "Increases the temperature",
        "active": "true",
        "ioType": "digital"
    }

];

var sensors = [
    {
        "id":"temperature",
        "name":"temperature",
        "description":"read the temp",
        "maxfrequency":"200",
        "frequency":"1000",
        "active":"true",
        "ioType":"Analog"
    },
    {
        "id":"light",
        "name":"light",
        "description":"read the ambient light",
        "maxfrequency":"200",
        "frequency":"1000",
        "active":"true",
        "ioType":"Analog"
    },
    {
        "id":"sound",
        "name":"sound",
        "description":"read the ambient noise har har har",
        "maxfrequency":"200",
        "frequency":"1000",
        "active":"true",
        "ioType":"Analog"
    }
];

var triggers = [
    {
        id : "temperature_greater_than_27",
        name : "temperature_greater_than_27",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_greater_than_27_condition(temperature) } )",
        triggerFunc: "( function() { this.temperature_too_hot(); })",
        active: true
    },

    {
        id : "temperature_greater_than_27_light_on",
        name : "temperature_greater_than_27_light_on",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_greater_than_27_light_on_condition(temperature) } )",
        triggerFunc: "( function() { this.temperature_heating_error(); } )",
        active: true
    },
    {
        id : "temperature_less_than_20_fan_on",
        name : "temperature_less_than_20_fan_on",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_less_than_20_fan_on_condition(temperature); } )",
        triggerFunc: "( function() { this.temperature_cooling_error(); })",
        active: true
    },

    {
        id : "temperature_greater_than_27_fan_off",
        name : "temperature_greater_than_27_fan_off",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_greater_than_27_fan_off_condition(temperature) } )",
        triggerFunc: "( function() { this.temperature_heating_error(); } )",
        active: true
    },
    {
        id : "temperature_less_than_20_light_off",
        name : "temperature_less_than_20_light_off",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_less_than_20_light_off_condition(temperature); } )",
        triggerFunc: "( function() { this.temperature_cooling_error(); })",
        active: true
    },

    {
        id : "temperature_less_than_20",
        name : "temperature_less_than_20",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition : "( function(temperature) { return this.temperature_less_than_20_condition(temperature); } )",
        triggerFunc : "( function() { this.temperature_too_cold(); } )",
        active: true
    },

    {
        id : "temperature_ok",
        name : "temperature_ok",
        sensor_id : "temperature",
        actuator_id : "fan",
        validator_id : "sound",
        condition :  "( function(temperature) { return this.temperature_ok_condition(temperature); } )",
        triggerFunc: "( function() { this.temperature_ok(); } )",
        active: true
    }];



TriggerModel.remove({}, function() {
    //    console.log("Removing document");
});

SensorModel.remove({},  function() {
    //    console.log("Removing document");
});

ActuatorModel.remove({},  function() {
    //    console.log("Removing document");
});

_.forEach(triggers,
          function(triggerJSON) {
              var trigger = new TriggerModel(triggerJSON);
              trigger.save(function(err) {
                  if (err) console.log(err);
              });
          });


_.forEach(sensors,
          function(sensorJSON) {
              var sensor = new SensorModel(sensorJSON);
              sensor.save(function(err) {
                  if (err) console.log(err);
              });
          });

_.forEach(actuators,
          function(JSON) {
              var rec = new ActuatorModel(JSON);
              rec.save(function(err) {
                  if (err) console.log(err);
              });
          });


// //db.close();
