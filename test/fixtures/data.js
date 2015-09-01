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
var fixtures = {
    too_hot: {
        "sensor_id": "temperature",
        "value": "28",
        "timestamp":"1438015679772"
    },
    light_on: {
        "sensor_id": "light",
        "value": "1000",
        "timestamp":"1438015679772"
    },
    fan_on: {"sensor_id": "fan", "value": "on", "timestamp":"1438015679772"},

    temperature_less_than_20: {"sensor_id": "temperature", "value": "19", "timestamp":"1438015679772"},
    temperature_greater_than_or_equal_20: {"sensor_id": "temperature", "value": "21", "timestamp":"1438015679772"},
    temperature_less_than_or_equal_27: {"sensor_id": "temperature", "value": "21", "timestamp":"1438015679772"},

    valid_data_1: {"sensor_id": "1", "value": "74.54047151375562", "timestamp":"1438015679772"},
    valid_data_2: {"sensor_id": "2", "value": "65.22398894652724", "timestamp":"1438015679772"},

    empty_sensor_reading: {"sensor_id": "1", "value": "", "timestamp":"1438015681778"},
    invalid_sensor_reading: {"sensor_id": "1", "value": "abcde", "timestamp":"1438015681778"},
    invalid_timestamp: {"sensor_id": "1", "value": "71.36048490181565", "timestamp":"abcde"},
    empty_timestamp: {"sensor_id": "1", "value": "71.36048490181565", "timestamp":""},
    invalid_sensor_id: {"sensor_id": "=---", "value": "83.30243791919202", "timestamp":"1438015683780"},
    empty_sensor_id: {"sensor_id": "", "value": "83.30243791919202", "timestamp":"1438015683780"}
};

module.exports = fixtures;
