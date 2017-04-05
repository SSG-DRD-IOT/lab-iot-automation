var mongoose = require('mongoose');
var _ = require('lodash');

mongoose.connect('mongodb://localhost/iotdemo');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Import the Database Model Objects
var TriggerModel = require('intel-commercial-edge-network-database-models').TriggerModel;
var SensorModel = require('intel-commercial-edge-network-database-models').SensorModel;
var ActuatorModel = require('intel-commercial-edge-network-database-models').ActuatorModel;

var actuators = [
    {
        "id": "lcd",
        "ipaddress": "http://localhost:10010",
        "name": "fan",
        "description": "Decreases the temperature",
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
    }
];

console.log("Before trigger definitions");

var triggers = [
    {
        id : "temperature_greater_than_27",
        name : "temperature_greater_than_27",
        sensor_id : "temperature",
        condition :  "( function(sensor_value) { return sensor_value.value > 27 } )",
        triggerFunc: "( function() { console.log(this.chalk.bold.red('Temperature is too Hot')); })",
        active: true
    },

    {
        id : "temperature_less_than_20",
        name : "temperature_less_than_20",
        sensor_id : "temperature",
        condition : "( function(sensor_value) { return sensor_value.value < 20 } )",
        triggerFunc : "( function() { console.log(this.chalk.bold.blue('Temperature is too Cold')); } )",
        active: true
    }];

TriggerModel.remove({}, function() {
    console.log("Removing document");
});

SensorModel.remove({},  function() {
   console.log("Removing document");
});

ActuatorModel.remove({},  function() {
   console.log("Removing document");
});

db.once('open', function (callback) {
    console.log("Connection to MongoDB successful");

    _.forEach(triggers,
              function(triggerJSON) {
                  var trigger = new TriggerModel(triggerJSON);
                  console.log(trigger);
                  trigger.save(function(err) {
                      console.log("Trigger Saved");
                      if (err) console.log(err);
		      console.log(trigger);
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

});
   console.log("Press CRTL+C to exit.")
