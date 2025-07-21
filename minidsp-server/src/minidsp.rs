use rocket::serde::{Deserialize, Serialize, json};
use std::error;
use std::process::Command;

#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatusWrapper {
    pub master: MinidspStatus,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct MinidspStatus {
    source: String,
    volume: f32,
    preset: u8,
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

pub fn set_minidsp_preset(preset: u8) -> Result<(), Box<dyn error::Error>> {
    Command::new("minidsp")
        .arg("config")
        .arg(preset.to_string())
        .output()?;
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
