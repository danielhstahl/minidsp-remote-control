"use strict";
import GPIO from "./onoff.ts";

const DIR_OUT = "out";
const OFF = 0;
const ON = 1;

export const openPin = (pin: number) => {
  return new GPIO(pin, DIR_OUT);
};
const toggle = (gpio: GPIO, type: typeof OFF | typeof ON) => {
  return gpio.write(type);
};
export const turnOn = (gpio: GPIO) => {
  return toggle(gpio, ON);
};

export const turnOff = (gpio: GPIO) => {
  return toggle(gpio, OFF);
};

export const getStatus = (gpio: GPIO) => {
  return gpio.read();
};
