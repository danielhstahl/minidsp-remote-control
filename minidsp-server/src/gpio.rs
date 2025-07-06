use rocket::request::FromParam;
use rocket::serde::{Deserialize, Serialize};
use rppal::gpio::OutputPin;

// Gpio uses BCM pin numbering.
#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
enum PowerStatus {
    OFF,
    ON,
}

impl<'r> FromParam<'r> for PowerStatus<'r> {
    type Error = &'r str;

    fn from_param(param: &'r str) -> Result<Self, Self::Error> {
        match param {
            "off" => Ok(PowerStatus::OFF),
            "on" => Ok(PowerStatus::ON),
            _ => Err(param),
        }
    }
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
