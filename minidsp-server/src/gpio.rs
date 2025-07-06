use rocket::serde::{Deserialize, Serialize};
use rppal::gpio::OutputPin;

// Gpio uses BCM pin numbering.
#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
enum PowerStatus {
    OFF,
    ON,
}

pub fn get_status(pin: &OutputPin) -> PowerStatus {
    if pin.is_set_high() {
        PowerStatus::ON
    } else {
        PowerStatus::OFF
    }
}
pub fn power_on(pin: &mut OutputPin) {
    pin.set_high();
}
pub fn power_off(pin: &mut OutputPin) {
    pin.set_low();
}
