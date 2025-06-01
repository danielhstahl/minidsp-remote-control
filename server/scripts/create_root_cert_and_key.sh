#!/usr/bin/env bash
if [ -z "$1" ]
then
    echo "Please supply a subdomain to create a certificate for";
    echo "e.g. www.mysite.com"
    exit;
fi
DOMAIN=$1
DAYS=3650

openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days $DAYS -out rootCA.pem -subj "/CN=${DOMAIN}"
openssl req -new -newkey rsa:4096 -sha256 -nodes -keyout device.key -subj "/CN=${DOMAIN}" -out device.csr
openssl req -x509 -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days $DAYS -sha256 -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN}" -copy_extensions copy

mv device.crt /home/minidsp/ssl/device.crt
mv device.key /home/minidsp/ssl/device.key
mv rootCA.pem /home/minidsp/ssl/rootCA.pem

# remove temp file
rm -f rootCA.key
rm -f device.csr

## NGINX config
systemctl reload nginx
