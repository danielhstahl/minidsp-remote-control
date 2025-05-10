"use strict";
const GPIO = require("./onoff").Gpio;

//const DIR_IN = "in";
const DIR_OUT = "out";
const OFF = 0;
const ON = 1;

const openPin = (pin) => {
  return new GPIO(pin, DIR_OUT);
};
const toggle = (gpio, type) => {
  return gpio.write(type);
};
const turnOn = (gpio) => {
  return toggle(gpio, ON);
};

const turnOff = (gpio) => {
  return toggle(gpio, OFF);
};

const getStatus = (gpio) => {
  return gpio.read();
};
module.exports = {
  openPin,
  turnOn,
  turnOff,
  getStatus,
};
