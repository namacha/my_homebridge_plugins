var request = require("request");
var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-contactsensor-prototype", "ContactSensor", ContactSensor);
}


function ContactSensor(log, config) {
    this.log = log;
    this.name = config["name"];
    this.url = "http://localhost:8080/status";
    this.status_name = config["status_name"];

    this.contactsensor = new Service.ContactSensor(this.name);

    this.contactsensor
        .getCharacteristic(Characteristic.ContactSensorState)
        .on('get', this.getState.bind(this));
}

ContactSensor.prototype.getState = function(callback) {
    this.log("Getting current state...");

    request.post({
        url: this.url,
        json: {"name": this.status_name}
    }, function(err, response, json) {

        if(!err && response.statusCode == 200) {
            var state = json.status;
            this.log("ContactSensor state is %s", state);
            var contact = state == "contact_not_detected"
            callback(null, contact);
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}


ContactSensor.prototype.getServices = function() { 
    return [this.contactsensor];
}
