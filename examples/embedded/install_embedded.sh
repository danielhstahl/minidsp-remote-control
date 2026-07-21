#!/bin/bash
#
# assumes no package management system
# DOES assume curl is already installed
## example of running this script: INSTALL_DIRECTORY=$HOME DOMAIN=raspberrypi.local RELEASE_TAG=v6.1.5 IP_LIST="192.168.1.1,192.168.1.2" ./install_embedded.sh


install_directory = "${INSTALL_DIRECTORY:-/storage/.config}"

mkdir -p $install_directory/minidsp
# don't run this script if already installed
MARKER=$install_directory/minidsp/.installed

if [ -f "$MARKER" ]; then
    echo "minidsp already installed, skipping"
    exit 0
fi

base_url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}"
ui_tar_name="minidsp-ui-embedded.tar.gz"
server_tar_name="minidsp-server-aarch64-unknown-linux-gnu-gpio.tar.gz"

## start from scratch
systemctl stop nginx || true
systemctl disable $install_directory/system.d/nginx.service || true
systemctl stop minidsp || true
systemctl disable $install_directory/system.d/minidsp.service || true
systemctl stop minidsp-ui || true
systemctl disable $install_directory/system.d/minidsp-ui.service || true

### handle server
mkdir -p $install_directory/minidsp/server
cd $install_directory/minidsp/server
url="${base_url}/${server_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${server_tar_name}
rm $server_tar_name
cd $install_directory/minidsp
### handle nginx folder
mkdir -p $install_directory/minidsp/nginx

### handle client and nginx conf
mkdir -p $install_directory/minidsp/client
cd $install_directory/minidsp/client
url="${base_url}/${ui_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${ui_tar_name}
rm $ui_tar_name
rm -r $install_directory/minidsp/dist || true
mv dist $install_directory/minidsp/
mv nginx.conf $install_directory/minidsp/nginx
touch $install_directory/minidsp/nginx/whitelist.conf
IFS=','
for item in $IP_LIST; do
    echo "allow $item;" >> $install_directory/minidsp/nginx/whitelist.conf
done

sed -i -e "s/HOSTNAME/${DOMAIN}/g" minidsp-ui.service
sed -i -e "s/INSTALL_DIRECTORY/${install_directory}/g" minidsp-ui.service
local_ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
sed -i -e "s/LOCAL_IP/${local_ip}/g" minidsp.toml
sed -i -e "s/INSTALL_DIRECTORY/${install_directory}/g" nginx.service
sed -i -e "s/INSTALL_DIRECTORY/${install_directory}/g" minidsp.service

mkdir -p $install_directory/system.d
mv minidsp-ui.service $install_directory/system.d/
mv minidsp.service $install_directory/system.d/
mv nginx.service $install_directory/system.d/
cd $install_directory/minidsp/
rm -r client

### handle nginx
cd $install_directory/minidsp/nginx
# precompiled nginx binaries
curl -L -O https://raw.githubusercontent.com/jirutka/nginx-binaries/binaries/nginx-1.28.0-aarch64-linux
mv nginx-1.28.0-aarch64-linux nginx
chmod +x nginx
sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
curl -L -O https://raw.githubusercontent.com/nginx/nginx/master/conf/mime.types
cd $install_directory/minidsp/

### handle ssl
mkdir -p $install_directory/minidsp/ssl

### handle minidsp-rs
mkdir -p $install_directory/minidsp/minidsprs
cd $install_directory/minidsp/minidsprs
#curl -L -O https://github.com/mrene/minidsp-rs/releases/download/v0.1.12/minidsp.aarch64-unknown-linux-gnu.tar.gz
curl -L -O https://github.com/danielhstahl/minidsp-rs/releases/download/v0.0.4/minidsp.aarch64-unknown-linux-gnu.tar.gz
tar -xzvf minidsp.aarch64-unknown-linux-gnu.tar.gz
rm minidsp.aarch64-unknown-linux-gnu.tar.gz
mkdir -p $install_directory/udev.rules.d/
curl -L -O https://raw.githubusercontent.com/danielhstahl/minidsp-rs/refs/tags/v0.0.4/debian/minidsp.udev
mv minidsp.udev $install_directory/udev.rules.d/
# reload udev
udevadm control --reload-rules && udevadm trigger
cd $install_directory/minidsp

### Create init SSL cert
cd $install_directory/minidsp/ssl

# This will get things started until regenerating them from UI
if [ -f device.key ] && [ -f device.crt ]; then
    echo "SSL cert already present, skipping generation"
else
    curl -L -O  https://raw.githubusercontent.com/openssl/openssl/master/apps/openssl.cnf
    openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout device.key -out device.crt -subj "/CN=$DOMAIN" -config openssl.cnf
fi
cd $install_directory/minidsp


### start services
systemctl enable --user --now $install_directory/system.d/nginx.service
systemctl enable --user --now $install_directory/system.d/minidsp-ui.service
systemctl enable --user --now $install_directory/system.d/minidsp.service

touch "$MARKER"
