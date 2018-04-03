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

var actuators = [
  {
    "id": "lcd",
    "ipaddress": "http://localhost:10010",
    "name": "lcd",
    "description": "Displays the temperature",
    "active": "true",
    "ioType": "i2c"
  }
];

var sensors = [
  {
    "id": "temperature",
    "name": "temperature",
    "description": "read the temp",
    "maxfrequency": "200",
    "frequency": "1000",
    "active": "true",
    "ioType": "Analog"
  }
];

console.log("Before trigger definitions");

var triggers = [
  {
    id: "temperature_greater_than_27",
    name: "temperature_greater_than_27",
    sensor_id: "temperature",
    condition: "( function(sensor_value) { return sensor_value.value > 27 } )",
    triggerFunc: "( function() { console.log(this.chalk.bold.red('Temperature is too Hot')); })",
    active: true
  }, {
    id: "temperature_less_than_20",
    name: "temperature_less_than_20",
    sensor_id: "temperature",
    condition: "( function(sensor_value) { return sensor_value.value < 20 } )",
    triggerFunc: "( function() { console.log(this.chalk.bold.blue('Temperature is too Cold')); } )",
    active: true
  }
];

db.once('open', function(callback) {
  console.log("Connection to MongoDB successful");
  _.forEach(triggers, function(triggerJSON) {
    var trigger = new Trigger(triggerJSON);
    console.log(trigger);
    trigger.save(function(err) {
      console.log("Trigger Saved");
      if (err)
        console.log(err);
      console.log(trigger);
    });
  });

  _.forEach(sensors, function(sensorJSON) {
    var sensor = new Sensor(sensorJSON);
    sensor.save(function(err) {
      if (err)
        console.log(err);
      }
    );
  });

  _.forEach(actuators, function(JSON) {
    var rec = new Actuator(JSON);
    rec.save(function(err) {
      if (err)
        console.log(err);
      }
    );
  });

});
console.log("Press CRTL+C to exit.")
