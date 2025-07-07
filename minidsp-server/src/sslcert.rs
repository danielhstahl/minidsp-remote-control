use rcgen::{
    BasicConstraints, Certificate, CertificateParams, DnType, DnValue::PrintableString,
    ExtendedKeyUsagePurpose, IsCa, Issuer, KeyPair, KeyUsagePurpose,
};
use std::error;
use std::fs;
use time::{Duration, OffsetDateTime};

pub fn generate_ca_and_entity(
    domain_name: &str,
    folder_path: &str,
) -> Result<(), Box<dyn error::Error>> {
    let (ca, issuer) = new_ca()?;
    let (end_entity, key_pair) = new_end_entity(&issuer, domain_name)?;
    let end_entity_pem = end_entity.pem();
    let ca_cert_pem = ca.pem();
    //todo, actually return these and make this function not have IO
    fs::create_dir_all(format!("{}/", folder_path))?;
    fs::write(
        format!("{}/rootCA.pem", folder_path),
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
    let ten_years = Duration::new(86400 * 3650, 0);
    //let yesterday = OffsetDateTime::now_utc().checked_sub(day).unwrap();
    let expiration = OffsetDateTime::now_utc().checked_add(ten_years).unwrap();
    expiration
}
