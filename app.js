
var util = require('util');
var bleno = require('bleno');
var gpio = require('pigpio').Gpio,
motor = new gpio(2,{mode: gpio.OUTPUT});
var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

var WriteOnlyCharacteristicThrottle = function() {
  WriteOnlyCharacteristicThrottle.super_.call(this, {
    uuid: '2aa9643cfd3f438287f8273e69febfaa',
    properties: ['write', 'writeWithoutResponse']
  });
};

var WriteOnlyCharacteristicLights = function() {
  WriteOnlyCharacteristicLights.super_.call(this, {
    uuid: 'd232752ba4a14cc9bcd2f2f4c7cad503',
    properties: ['write', 'writeWithoutResponse']
  });
};

util.inherits(WriteOnlyCharacteristicThrottle, BlenoCharacteristic);

WriteOnlyCharacteristicThrottle.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  
  console.log('WriteOnlyCharacteristicThrottle write request: ' + parseFloat(data.toString()) + ' ' + offset + ' ' + withoutResponse);
  var number = 1500 + (800 * parseFloat(data.toString()));
  console.log(number);
  motor.servoWrite(Math.floor(number));
  callback(this.RESULT_SUCCESS);
};

util.inherits(WriteOnlyCharacteristicLights, BlenoCharacteristic);
WriteOnlyCharacteristicLights.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  
  console.log('WriteOnlyCharacteristic Lights write request: ' + parseFloat(data.toString()) + ' ' + offset + ' ' + withoutResponse);
  var number = parseFloat(data.toString());
  console.log('Lights set to');
  //Implement your own on/off solution for board lights here:
  console.log(number);
  
  callback(this.RESULT_SUCCESS);
};

function SampleService() {
  SampleService.super_.call(this, {
    uuid: '158fee4a6f7b43e68bdea37bac8114af',
    characteristics: [
      new WriteOnlyCharacteristicThrottle(),
      new WriteOnlyCharacteristicLights()
    ]
  });
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('board', ['158fee4a6f7b43e68bdea37bac8114af']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  motor.servoWrite(1500)
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new SampleService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});
