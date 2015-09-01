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
var triggerd_config_fixture = {
    default_config : {
        "mqtt" : {
            "uri" : "mqtt://localhost"
        },

        "mongodb" : {
            "uri" : "mongodb://localhost/iotdemo"
        },

        "debug" : {
            "level" : "error"
        }
    },
    test_config : {
        "mqtt" : {
            "uri" : "mqtt://localhost"
        },

        "mongodb" : {
            "uri" : "mongodb://localhost/iotdemo-test"
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

    },

    invalid_mongodb_uri : {
        "mqtt" : {
            "uri" : "mqtt://localhost"
        },

        "mongodb" : {
            "uri" : "mongodb://invalid/iotdemo-test"
        },

        "debug" : {
            "level" : {
                "console" : "trace",
                "file" : "error"
            }
        },

        "threshold" : {
            "temp_high" : 27,
            "temp_low" : 20,
            "sound" : 40,
            "light" : 700
        }

    },

    config_1 : {
        "mqtt" : {
            "uri" : "mqtt://config_1"
        },

        "mongodb" : {
            "uri" : "mongodb://localhost/config_1"
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

    }
};

module.exports = triggerd_config_fixture;
