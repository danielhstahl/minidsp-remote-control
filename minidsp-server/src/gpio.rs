use rocket::request::FromParam;
use rocket::serde::{Deserialize, Serialize};
use rppal::gpio::OutputPin;

// Gpio uses BCM pin numbering.
#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde", rename_all = "lowercase")]
pub enum PowerStatus {
    OFF,
    ON,
}

impl<'a> FromParam<'a> for PowerStatus {
    type Error = &'a str;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use rocket::serde::json;

    #[test]
    fn test_power_status_serialization() {
        let status = PowerStatus::ON;
        let serialized = json::to_string(&status).unwrap();
        assert_eq!(serialized, "\"on\"");

        let status = PowerStatus::OFF;
        let serialized = json::to_string(&status).unwrap();
        assert_eq!(serialized, "\"off\"");
    }

    #[test]
    fn test_power_status_deserialization() {
        let status: PowerStatus = json::from_str("\"on\"").unwrap();
        assert!(matches!(status, PowerStatus::ON));

        let status: PowerStatus = json::from_str("\"off\"").unwrap();
        assert!(matches!(status, PowerStatus::OFF));
    }

    #[test]
    fn test_power_status_from_param() {
        let status = PowerStatus::from_param("on").unwrap();
        assert!(matches!(status, PowerStatus::ON));

        let status = PowerStatus::from_param("off").unwrap();
        assert!(matches!(status, PowerStatus::OFF));

        let err = PowerStatus::from_param("invalid");
        assert!(err.is_err());
    }
}
