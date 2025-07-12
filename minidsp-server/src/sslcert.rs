use rcgen::{
    BasicConstraints, Certificate, CertificateParams, DnType, DnValue::PrintableString,
    ExtendedKeyUsagePurpose, IsCa, Issuer, KeyPair, KeyUsagePurpose,
};
use rocket::serde::Serialize;
use std::error;
use std::fs;
use std::io::Read;
use time::{Duration, OffsetDateTime};
use x509_parser::parse_x509_certificate;
use x509_parser::pem::parse_x509_pem;

pub const ROOT_CA_NAME: &str = "rootCA.pem";

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
pub struct CertExpiry {
    #[serde(with = "time::serde::iso8601")]
    pub expiry: OffsetDateTime,
}

// OS specific, only run on linux
#[cfg(target_os = "linux")]
pub fn reload_nginx() -> Result<(), Box<dyn error::Error>> {
    Command::new("/usr/bin/systemctl")
        .arg("reload")
        .arg("nginx")
        .output()?;
    Ok(())
}

pub fn get_certificate_expiry_date_from_file(
    folder_path: &str,
) -> Result<OffsetDateTime, Box<dyn std::error::Error>> {
    let mut file = fs::File::open(format!("{}/{}", folder_path, ROOT_CA_NAME))?;
    let mut cert_pem_bytes = Vec::new();
    file.read_to_end(&mut cert_pem_bytes)?;

    let (_, pem) = parse_x509_pem(&cert_pem_bytes)?;
    let (_, x509) = parse_x509_certificate(&pem.contents)?;

    Ok(x509.validity().not_after.to_datetime())
}
pub fn generate_ca_and_entity(
    domain_name: &str,
    folder_path: &str,
) -> Result<(), Box<dyn error::Error>> {
    let (ca, issuer) = new_ca()?;
    let (end_entity, key_pair) = new_end_entity(&issuer, domain_name)?;
    let end_entity_pem = end_entity.pem();
    let ca_cert_pem = ca.pem();
    fs::create_dir_all(format!("{}/", folder_path))?;
    fs::write(
        format!("{}/{}", folder_path, ROOT_CA_NAME),
        ca_cert_pem.as_bytes(),
    )?;
    fs::write(
        format!("{}/device.crt", folder_path),
        end_entity_pem.as_bytes(),
    )?;
    fs::write(
        format!("{}/device.key", folder_path),
        key_pair.serialize_pem(),
    )?;
    Ok(())
}

fn new_ca() -> Result<(Certificate, Issuer<'static, KeyPair>), Box<dyn error::Error>> {
    let mut params = CertificateParams::new(Vec::default())?;
    let expiration = validity_period();
    params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
    params.distinguished_name.push(
        DnType::CountryName,
        PrintableString("US".try_into().unwrap()),
    );
    params
        .distinguished_name
        .push(DnType::OrganizationName, "MinidspServer");
    params.key_usages.push(KeyUsagePurpose::DigitalSignature);
    params.key_usages.push(KeyUsagePurpose::KeyCertSign);
    params.key_usages.push(KeyUsagePurpose::CrlSign);

    params.not_after = expiration;

    let key_pair = KeyPair::generate()?;
    let cert = params.self_signed(&key_pair)?;
    Ok((cert, Issuer::new(params, key_pair)))
}

fn new_end_entity(
    issuer: &Issuer<'static, KeyPair>,
    domain_name: &str,
) -> Result<(Certificate, KeyPair), Box<dyn error::Error>> {
    let mut params = CertificateParams::new(vec![domain_name.to_string()])?;
    let expiration = validity_period();
    params
        .distinguished_name
        .push(DnType::CommonName, domain_name);
    params.use_authority_key_identifier_extension = true;
    params.key_usages.push(KeyUsagePurpose::DigitalSignature);
    params
        .extended_key_usages
        .push(ExtendedKeyUsagePurpose::ServerAuth);
    //params.not_before = yesterday;
    params.not_after = expiration;

    let key_pair = KeyPair::generate()?;
    let signed_cert = params.signed_by(&key_pair, issuer)?;
    Ok((signed_cert, key_pair))
}

fn validity_period() -> OffsetDateTime {
    let ten_years = Duration::new(315360000, 0);
    let expiration = OffsetDateTime::now_utc().checked_add(ten_years).unwrap();
    expiration
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn it_writes_and_returns_correct_expiration() {
        let second = Duration::new(1, 0);
        let expiry = validity_period().checked_sub(second).unwrap(); //needed since result truncates nano seconds
        generate_ca_and_entity("hello", "test").unwrap();
        let result = get_certificate_expiry_date_from_file("test").unwrap();
        assert!(result > expiry);
        fs::remove_dir_all("test").unwrap();
    }
}
