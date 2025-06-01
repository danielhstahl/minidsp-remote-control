#!/usr/bin/env bash
if [ -z "$1" ]
then
    echo "Please supply a subdomain to create a certificate for";
    echo "e.g. www.mysite.com"
    exit;
fi
DOMAIN=$1
DAYS=3650

mkdir -p /home/minidsp/ssl/tmp

openssl genrsa -out /home/minidsp/ssl/tmp/rootCA.key 4096
openssl req -x509 -new -nodes -key /home/minidsp/ssl/tmp/rootCA.key -sha256 -days $DAYS -out /home/minidsp/ssl/tmp/rootCA.pem -subj "/CN=${DOMAIN}"
openssl req -new -newkey rsa:4096 -sha256 -nodes -keyout /home/minidsp/ssl/tmp/device.key -subj "/CN=${DOMAIN}" -out /home/minidsp/ssl/tmp/device.csr
openssl req -x509 -in /home/minidsp/ssl/tmp/device.csr -CA /home/minidsp/ssl/tmp/rootCA.pem -CAkey /home/minidsp/ssl/tmp/rootCA.key -CAcreateserial -out /home/minidsp/ssl/tmp/device.crt -days $DAYS -sha256 -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN}" -copy_extensions copy

mv /home/minidsp/ssl/tmp/device.crt /home/minidsp/ssl/device.crt
mv /home/minidsp/ssl/tmp/device.key /home/minidsp/ssl/device.key
mv /home/minidsp/ssl/tmp/rootCA.pem /home/minidsp/ssl/rootCA.pem

# remove temp directory
rm -r /home/minidsp/ssl/tmp

## NGINX config
# the sudo is needed to not use a password, see /etc/sudoers
sudo /usr/bin/systemctl reload nginx
