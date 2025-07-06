use rocket::serde::{Deserialize, Serialize};
use rppal::gpio::Gpio;
use rppal::system::DeviceInfo;
use std::error::Error;
use std::thread;
use std::time::Duration;

// Gpio uses BCM pin numbering.
//const GPIO_RELAY_PIN: u8 = 21; //533, see cat /sys/kernel/debug/gpio

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
enum PowerStatus {
    OFF,
    ON,
}

pub fn get_status(pin: &Gpio::OutputPin) -> PowerStatus {
    if pin.is_set_high() {
        PowerStatus::ON
    } else {
        PowerStatus::OFF
    }
}
pub fn power_on(pin: &mut Gpio::OutputPin) {
    pin.set_high();
}
pub fn power_off(pin: &mut Gpio::OutputPin) {
    pin.set_low();
}
