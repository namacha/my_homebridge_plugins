var request = require("request");
var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-doorlock-prototype", "DoorLockPrototype", LockAccessory);
}


function LockAccessory(log, config) {
    this.log = log;
    this.name = config["name"];

    this.order_url = "http://localhost:8080/order";
    this.status_url = "http://localhost:8080/status";


    this.lockservice = new Service.LockMechanism(this.name);

    this.lockservice
        .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));

    this.lockservice
        .getCharacteristic(Characteristic.LockTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));
}

LockAccessory.prototype.getState = function(callback) {
    this.log("Getting current state...");

    request.post({
        url: this.status_url,
        headers: {'Content-Type':'application/json'},
        json: {"name": "lock"}
    }, function(err, response, body) {

        if(!err && response.statusCode == 200) {
            var json = body;
            var state = json.status;
            this.log("Lock state is %s", state);
            var locked = state == "locked"
                callback(null, locked);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}


LockAccessory.prototype.setState = function(state, callback) {
    var action = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";

    this.log("Set state to %s", action);

    request.post({
        url: this.order_url,
        headers: {'Content-Type':'application/json'},
        json: {"action": action}
    }, function(err, response, body) {

        if(!err && response.statusCode == 200) {
            this.log("State Changed.");

            var currentState = (state == Characteristic.LockTargetState.SECURED) ?
                Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

            this.lockservice
                .setCharacteristic(Characteristic.LockCurrentState, currentState);

            callback(null);
        }
        else {
            this.log("Error '%s' setting lock state. Response: %s", err, body);
            callback(err || new Error("Error setting lock state."));
        }
    }.bind(this));
},

LockAccessory.prototype.getServices = function() { 
    return [this.lockservice];
}
