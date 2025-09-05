use rocket::serde::{Deserialize, Deserializer, Serialize, json};
use std::error;
use std::process::Command;
#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatusWrapper {
    pub master: MinidspStatus,
}

// This function attempts to deserialize a value as an i32, then
// converts that i32 to a String.
fn deserialize_int_as_string<'a, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'a>,
{
    let number = i32::deserialize(deserializer)?;
    Ok(number.to_string())
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatus {
    source: String,
    volume: f32,
    #[serde(deserialize_with = "deserialize_int_as_string")]
    preset: String,
}
pub fn get_minidsp_status() -> Result<MinidspStatus, Box<dyn error::Error>> {
    let result = Command::new("minidsp").arg("-o").arg("json").output()?;
    let result_str = str::from_utf8(&result.stdout)?;
    let wrapper: MinidspStatusWrapper = json::from_str(result_str)?;
    Ok(wrapper.master)
}

pub fn increment_minidsp_vol(gain: f32) -> Result<(), Box<dyn error::Error>> {
    Command::new("minidsp")
        .arg("gain")
        .arg("--relative")
        .arg("--")
        .arg(gain.to_string())
        .output()?;
    Ok(())
}

pub fn set_minidsp_vol(gain: f32) -> Result<(), Box<dyn error::Error>> {
    Command::new("minidsp")
        .arg("gain")
        .arg("--")
        .arg(gain.to_string())
        .output()?;
    Ok(())
}

pub fn set_minidsp_preset(preset: &str) -> Result<(), Box<dyn error::Error>> {
    Command::new("minidsp").arg("config").arg(preset).output()?;
    Ok(())
}

pub fn set_minidsp_source(source: &str) -> Result<(), Box<dyn error::Error>> {
    // note that the source output from minidspStatus has first letter capitalized,
    // but setting the source requires lowercase
    // see https://minidsp-rs.pages.dev/cli/master/source
    Command::new("minidsp")
        .arg("config")
        .arg(source.to_lowercase())
        .output()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::MinidspStatus;
    use rocket::serde::json;
    #[test]
    fn it_deserializes_to_string() {
        let str_to_deser = r#"{
            "source": "Example",
            "volume": 12345,
            "preset": 1
        }"#;
        let wrapper: MinidspStatus = json::from_str(str_to_deser).unwrap();
        assert_eq!(wrapper.preset, "1".to_string());
    }
}
