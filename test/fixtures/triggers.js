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
var trigger_fixtures = {

    valid_1: {
        "id": "1",
        "name": "Fan Off",
        "sensor_id": "b506768ce1e2353fe063d344e89e53e5",
        "actuator_id": "752293f38a3d0e683178cdac2f864468",
        "validator_id": "b506768ce1e2353fe063d344e89e53e5",
        "condition": "<80",
        "triggerFunc": [
            {
                "deviceId": "752293f38a3d0e683178cdac2f864468",
                "action": "off"
            }
        ],
        "active": "true"
    },

    fan_on: {
        "id": "fan_on",
        "name": "fan_on",
        "sensor_id": "temperature",
        "actuator_id": "fan",
        "validator_id": "sound",
        "condition": ">80",
        "triggerFunc": [
            {
                "deviceId": "Fan",
                "action": "on"
            }
        ],
        "active": "true"
    },

    too_hot :   {
        "id" : "too_hot",
        "name" : "too_hot",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.too_hot_condition(temperature) } )",
        "triggerFunc" : "( function() { this.mqttClient.publish('sensors/temperature_too_hot/alerts','{\"alert\" : \"Hot\"}' ); })",
        "active" : true
    },

    heating_error : {
        "id" : "heating_error",
        "name" : "heating_error",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.heating_error_condition(temperature) } )",
        "triggerFunc" : "( function() { this.temperature_heating_error(); } )",
        "active" : true
    },

    temperature_less_than_20_fan_on :   {
        "id" : "temperature_less_than_20_fan_on",
        "name" : "temperature_less_than_20_fan_on",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.temperature_less_than_20_fan_on_condition(temperature); } )",
        "triggerFunc" : "( function() { this.temperature_cooling_error(); })",
        "active" : true
    },

    too_hot_fan_off : {
        "id" : "too_hot_fan_off",
        "name" : "too_hot_fan_off",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.too_hot_fan_off_condition(temperature) } )",
        "triggerFunc" : "( function() { this.temperature_heating_error(); } )",
        "active" : true
    },

    temperature_less_than_20_light_off : {
        "id" : "temperature_less_than_20_light_off",
        "name" : "temperature_less_than_20_light_off",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.temperature_less_than_20_light_off_condition(temperature); } )",
        "triggerFunc" : "( function() { this.temperature_cooling_error(); })",
        "active" : true
    },

    temperature_less_than_20 : {
        "id" : "temperature_less_than_20",
        "name" : "temperature_less_than_20",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" : "( function(temperature) { return this.temperature_less_than_20_condition(temperature); } )",
        "triggerFunc" : "( function() { this.temperature_too_cold(); } )",
        "active" : true
    },

    temperature_ok : {
        "id" : "temperature_ok",
        "name" : "temperature_ok",
        "sensor_id" : "temperature",
        "actuator_id" : "fan",
        "validator_id" : "sound",
        "condition" :  "( function(temperature) { return this.temperature_ok_condition(temperature); } )",
        "triggerFunc" : "( function() { this.temperature_ok(); } )",
        "active" : true
    }
};

module.exports = trigger_fixtures;
