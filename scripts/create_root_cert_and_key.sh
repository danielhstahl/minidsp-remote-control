#!/usr/bin/env bash
if [ -z "$1" ]
then
    echo "Please supply a subdomain to create a certificate for";
    echo "e.g. www.mysite.com"
    exit;
fi
DOMAIN=$1
DAYS=3650
sudo mkdir -p /etc/ssl/local
openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days $DAYS -out rootCA.pem -subj "/CN=${DOMAIN}"
openssl req -new -newkey rsa:4096 -sha256 -nodes -keyout device.key -subj "/CN=${DOMAIN}" -out device.csr
#cat v3.ext | sed s/%%DOMAIN%%/"$DOMAIN"/g > /tmp/__v3.ext
#openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days $DAYS -sha256 -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN}"

openssl req -x509 -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days $DAYS -sha256 -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN}" -copy_extensions copy

#openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out device.crt -days $DAYS -sha256 -extfile /tmp/__v3.ext


# move output files to final filenames
mv device.csr "$DOMAIN.csr"
cp device.crt "$DOMAIN.crt"

# remove temp file
rm -f device.crt;

sudo mv $DOMAIN.crt /etc/ssl/local/$DOMAIN.crt
sudo mv device.key /etc/ssl/local/device.key
sudo mv rootCA.pem /etc/ssl/local/rootCA.pem

## NGINX config
sed -i -e "s/HOSTNAME/${DOMAIN}/g" examples/nginx
sudo cp examples/nginx /etc/nginx/sites-available/$DOMAIN
sudo ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/ || true
