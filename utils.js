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
module.exports = {
    //Retrieve the topic for listening to a device's data given a specific device ID.
    dataTopic: function (id) {
        return "sensors/" + id + "/data";
    },

    //Retrieve the topic for sending control messages to a device given a specific
    //device id.
    controlTopic: function (id) {
        return "actuators/" + id + "/control";
    },

    //Retrieve the topic for sending error messages to a device given a specific
    //device id.
    errorTopic: function (id) {
        return "other/" + id + "/errors";
    },

    //Get a device id from a topic.
    getID: function (topic) {
        return topic.substr(8, 32);
    },

    //Get the type of data being parsed from an announcement.
    getType: function (topic) {
        return topic.substr(42, topic.length);
    },

    isSensorTopic: function(str) {
        return str.match(/sensors\/[A-Za-z0-9]{0,32}\/data/);
    },

    isTriggerTopic: function(str) {
        return str.match(/trigger\/data/);
    },

    isRefreshTopic: function(str) {
        return str.match(/triggers\/refresh/);
    }

};

// { id: 2,
//   name: 'LampON',
//   sensor_id: 1,
//   actuator_id: 2,
//   condition: '<75',
//   triggerFunc: 'on',
//   active: 'true' }
