# assumes no package management system
# DOES assume sqlite and curl are already installed
## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v6.1.5 ./install_embedded.sh
base_url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}"
ui_tar_name="minidsp-ui-embedded.tar.gz"
server_tar_name="minidsp-server-aarch64-unknown-linux-gnu-gpio.tar.gz"

### handle server
mkdir -p server
cd server
url="${base_url}/${server_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${server_tar_name}
rm $server_tar_name
cd ..
### handle nginx folder
mkdir -p nginx

### handle client and nginx conf
mkdir -p client
cd client
url="${base_url}/${ui_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
tar -xzvf ${ui_tar_name}
rm $ui_tar_name
mv dist ../
mv nginx.conf ../nginx
uuid=$(uuidgen)
sed -i -e "s/ADMIN_PASSWORD/${uuid}/g" minidsp-ui.service
mv minidsp-ui.service /storage/.config/system.d/
mv minidsp.service /storage/.config/system.d/
mv nginx.service /storage/.config/system.d/
cd ../
rm -r client

### handle nginx
cd nginx
# precompiled nginx binaries
curl -L -O https://raw.githubusercontent.com/jirutka/nginx-binaries/binaries/nginx-1.28.0-aarch64-linux
mv nginx-1.28.0-aarch64-linux nginx
chmod +x nginx
sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
curl -L -O https://raw.githubusercontent.com/nginx/nginx/master/conf/mime.types
cd ..

### handle sqlite
mkdir -p db

### handle ssl
mkdir -p ssl

### handle minidsp-rs
mkdir -p minidsprs
cd minidsprs
#curl -L -O https://github.com/mrene/minidsp-rs/releases/download/v0.1.12/minidsp.aarch64-unknown-linux-gnu.tar.gz
curl -L -O https://github.com/danielhstahl/minidsp-rs/releases/download/v0.0.4/minidsp.aarch64-unknown-linux-gnu.tar.gz
tar -xzvf minidsp.aarch64-unknown-linux-gnu.tar.gz
rm minidsp.aarch64-unknown-linux-gnu.tar.gz
cd ..

### Create init SSL cert
cd ssl
curl -L -O  https://raw.githubusercontent.com/openssl/openssl/master/apps/openssl.cnf
# This will get things started until regenerating them from UI
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout device.key -out device.crt -subj "/CN=$DOMAIN" -config openssl.cnf
cd ..

### start services
systemctl enable /storage/.config/system.d/nginx.service
systemctl enable /storage/.config/system.d/minidsp-ui.service
systemctl enable /storage/.config/system.d/minidsp.service
#systemctl disable /storage/.config/system.d/nginx.service
#systemctl disable /storage/.config/system.d/minidsp-ui.service
