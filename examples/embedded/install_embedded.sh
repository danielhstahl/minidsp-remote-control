#!/bin/bash
#
# assumes no package management system
# DOES assume curl is already installed
## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v6.1.5 IP_LIST="192.168.1.1,192.168.1.2" ./install_embedded.sh

# don't run this script if already installed
MARKER=/storage/.config/minidsp/.installed

if [ -f "$MARKER" ]; then
    echo "minidsp already installed, skipping"
    exit 0
fi

base_url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}"
ui_tar_name="minidsp-ui-embedded.tar.gz"
server_tar_name="minidsp-server-aarch64-unknown-linux-gnu-gpio.tar.gz"

## start from scratch
systemctl stop nginx || true
systemctl disable /storage/.config/system.d/nginx.service || true
systemctl stop minidsp || true
systemctl disable /storage/.config/system.d/minidsp.service || true
systemctl stop minidsp-ui || true
systemctl disable /storage/.config/system.d/minidsp-ui.service || true

### handle server
mkdir -p /storage/.config/minidsp/server
cd /storage/.config/minidsp/server
url="${base_url}/${server_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${server_tar_name}
rm $server_tar_name
cd /storage/.config/minidsp
### handle nginx folder
mkdir -p /storage/.config/minidsp/nginx

### handle client and nginx conf
mkdir -p /storage/.config/minidsp/client
cd /storage/.config/minidsp/client
url="${base_url}/${ui_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${ui_tar_name}
rm $ui_tar_name
rm -r /storage/.config/minidsp/dist || true
mv dist /storage/.config/minidsp/
mv nginx.conf /storage/.config/minidsp/nginx
touch /storage/.config/minidsp/nginx/whitelist.conf
IFS=','
for item in $IP_LIST; do
    echo "allow $item" >> /storage/.config/minidsp/nginx/whitelist.conf
done

sed -i -e "s/HOSTNAME/${DOMAIN}/g" minidsp-ui.service
local_ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
sed -i -e "s/LOCAL_IP/${local_ip}/g" minidsp.toml
mv minidsp-ui.service /storage/.config/system.d/
mv minidsp.service /storage/.config/system.d/
mv nginx.service /storage/.config/system.d/
cd /storage/.config/minidsp/
rm -r client

### handle nginx
cd /storage/.config/minidsp/nginx
# precompiled nginx binaries
curl -L -O https://raw.githubusercontent.com/jirutka/nginx-binaries/binaries/nginx-1.28.0-aarch64-linux
mv nginx-1.28.0-aarch64-linux nginx
chmod +x nginx
sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
curl -L -O https://raw.githubusercontent.com/nginx/nginx/master/conf/mime.types
cd /storage/.config/minidsp/

### handle ssl
mkdir -p /storage/.config/minidsp/ssl

### handle minidsp-rs
mkdir -p /storage/.config/minidsp/minidsprs
cd /storage/.config/minidsp/minidsprs
#curl -L -O https://github.com/mrene/minidsp-rs/releases/download/v0.1.12/minidsp.aarch64-unknown-linux-gnu.tar.gz
curl -L -O https://github.com/danielhstahl/minidsp-rs/releases/download/v0.0.4/minidsp.aarch64-unknown-linux-gnu.tar.gz
tar -xzvf minidsp.aarch64-unknown-linux-gnu.tar.gz
rm minidsp.aarch64-unknown-linux-gnu.tar.gz
mkdir -p /storage/.config/udev.rules.d/
curl -L -O https://raw.githubusercontent.com/danielhstahl/minidsp-rs/refs/tags/v0.0.4/debian/minidsp.udev
mv minidsp.udev /storage/.config/udev.rules.d/
# reload udev
udevadm control --reload-rules && udevadm trigger
cd /storage/.config/minidsp

### Create init SSL cert
cd /storage/.config/minidsp/ssl

# This will get things started until regenerating them from UI
if [ -f device.key ] && [ -f device.crt ]; then
    echo "SSL cert already present, skipping generation"
else
    curl -L -O  https://raw.githubusercontent.com/openssl/openssl/master/apps/openssl.cnf
    openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout device.key -out device.crt -subj "/CN=$DOMAIN" -config openssl.cnf
fi
cd /storage/.config/minidsp

### start services
systemctl enable --now /storage/.config/system.d/nginx.service
systemctl enable --now /storage/.config/system.d/minidsp-ui.service
systemctl enable --now /storage/.config/system.d/minidsp.service

touch "$MARKER"
