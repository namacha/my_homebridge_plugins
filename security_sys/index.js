var request = require("request");
var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-security-prototype", "SecurityPrototype", SecurityAccessory);
}


function SecurityAccessory(log, config) {
    this.log = log;
    this.name = config["name"];

    this.order_url = "http://localhost:8080/order";
    this.status_url = "http://localhost:8080/status";


    this.securityservice = new Service.SecuritySystem(this.name);

    this.securityservice
        .getCharacteristic(Characteristic.SecuritySystemCurrentState)
        .on('get', this.getState.bind(this));

    this.securityservice
        .getCharacteristic(Characteristic.SecuritySystemTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));
}

SecurityAccessory.prototype.getState = function(callback) {
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        headers: {'Content-Type':'application/json'},
        json: {"name": "security"}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            var state = json.status;
            this.log("Security state is %s", state);
            var locked = state == "armed"
            callback(null, locked);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}


SecurityAccessory.prototype.setState = function(state, callback) {
    var action = (state == Characteristic.SecuritySystemCurrentState.STAY_ARM) ? "disarm" : "arm";

    this.log("Set state to %s", action);

    request.post({
        url: this.order_url,
        headers: {'Content-Type':'application/json'},
        json: {"action": action}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            this.log("State Changed.");

            var currentState = (state == Characteristic.SecuritySystemTargetState.STAY_ARM) ?
                Characteristic.SecuritySystemCurrentState.STAY_ARM : Characteristic.SecuritySystemCurrentState.AWAY_ARM;

            this.securityservice
                .setCharacteristic(Characteristic.SecuritySystemCurrentState, currentState);

            callback(null);
        }
        else {
            this.log("Error '%s' setting security state. Response: %s", err, JSON.stringify(json));
            callback(err || new Error("Error setting security state."));
        }
    }.bind(this));
},

SecurityAccessory.prototype.getServices = function() { 
    return [this.securityservice];
}
