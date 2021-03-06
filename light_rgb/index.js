var request = require("request");
var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-rgblight-prototype", "RGBLightbulb", Lightbulb);
}


function Lightbulb(log, config) {
    this.log = log;
    this.name = config["name"];

    this.order_url = "http://localhost:8080/order";
    this.status_url = "http://localhost:8080/status";


    this.lightbulb = new Service.Lightbulb(this.name);

    this.lightbulb
        .getCharacteristic(Characteristic.Brightness)
    .on('get', this.getBrightness.bind(this))
    .on('set', this.setBrightness.bind(this));

    this.lightbulb
        .getCharacteristic(Characteristic.Hue)
    .on('get', this.getHue.bind(this))
    .on('set', this.setHue.bind(this));

    this.lightbulb
        .getCharacteristic(Characteristic.Saturation)
    .on('get', this.getSaturation.bind(this))
    .on('set', this.setSaturation.bind(this));


    this.lightbulb
        .getCharacteristic(Characteristic.On)
    .on('get', this.getPower.bind(this))
    .on('set', this.setPower.bind(this));

}

Lightbulb.prototype.getPower = function(callback) {
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        json: {"name": "light_power"}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            var state = json.status;
            this.log("Light is %s", state);
            var on = state == "on";
            callback(null, on);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}


Lightbulb.prototype.setPower = function(state, callback) {
    var action = state ? "light_on" : "light_off";

    this.log("Set state to %s", action);

    request.post({
        url: this.order_url,
        json: {"action": action}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            this.log("State Changed.");
            callback(null);
        }
        else {
            this.log("Error '%s' setting light state. Response: %s", err, body);
            callback(err || new Error("Error setting light state."));
        }
    }.bind(this));
}


Lightbulb.prototype.setBrightness = function(state, callback) { 
    this.log("Setting brightness...")

    request.post({
        url: this.order_url,
        json: {
                "action": "set_brightness",
                "value": state
        }}, function(err, response, json) {
            if(!err && response.statusCode == 200) { 
                callback(null);
                this.log("Brightness set to %d", state);
            }
            else {
                this.log("Error setting brightness (status code %s): %s", response.statusCode, err);
                callback(err);
            }
        }.bind(this));
}


Lightbulb.prototype.getBrightness = function(callback) { 
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        json: {"name": "light_brightness"}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            var state = json.status;
            this.log("Light brightness is %d", state);
            callback(null, state);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}

Lightbulb.prototype.getSaturation = function(callback) {
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        json: {"name": "light_rgb"}
    }, function(err, response, json) {
        if(!err && response.statusCode == 200) {
            var state = JSON.parse(json.status);
            this.log("Light hue is %d", state.hue);
            callback(null, state.saturation);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}

Lightbulb.prototype.setSaturation = function(state, callback) { 
    this.log("Setting saturation...")

    request.post({
        url: this.order_url,
        json: {
                "action": "set_saturation",
                "value": state
        }}, function(err, response, json) {
            if(!err && response.statusCode == 200) { 
                callback(null);
                this.log("saturate set to %d", state);
            }
            else {
                this.log("Error setting saturation (status code %s): %s", response.statusCode, err);
                callback(err);
            }
        }.bind(this));
}

Lightbulb.prototype.getHue = function(callback) { 
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        json: {"name": "light_rgb"}
    }, function(err, response, json) {
        if(!err && response.statusCode == 200) {
            var state = JSON.parse(json.status);
            this.log("Light hue is %d", state.hue);
            callback(null, state.hue);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}

Lightbulb.prototype.setHue = function(state, callback) { 
    this.log("Setting hue...")

    request.post({
        url: this.order_url,
        json: {
                "action": "set_hue",
                "value": state
        }}, function(err, response, json) {
            if(!err && response.statusCode == 200) { 
                callback(null);
                this.log("Hue set to %d", state);
            }
            else {
                this.log("Error setting hue (status code %s): %s", response.statusCode, err);
                callback(err);
            }
        }.bind(this));
}


Lightbulb.prototype.getServices = function() { 
    return [this.lightbulb];
}
