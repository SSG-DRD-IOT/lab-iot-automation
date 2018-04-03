var mongoose = require('mongoose');
var _ = require('lodash');

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/iotdemo');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Import the Database Model Objects
//var Data = require('../../../../commercial-edge-network-database').Data;
//var SensorCloudModel = require('../../../../commercial-edge-network-database').SensorCloudModel;
var Trigger = require('intel-commercial-edge-network-database-models').Trigger;
var Sensor = require('intel-commercial-edge-network-database-models').Sensor;
var Actuator = require('intel-commercial-edge-network-database-models').Actuator;
var Data = require('intel-commercial-edge-network-database-models').Data;

Trigger.remove({}, function() {
    console.log("Removing Triggers");
})

Sensor.remove({}, function() {
   console.log("Removing Sensors");
});

Actuator.remove({}, function() {
   console.log("Removing Actuators");
});

Data.remove({}, function() {
   console.log("Removing Data");
});
console.log("Press CRTL+C to exit.")
