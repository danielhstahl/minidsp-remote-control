# assumes no package management system
# DOES assume sqlite and curl are already installed
## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v4.0.2 ./install_embedded.sh
base_url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}"
ui_tar_name="minidsp-ui.tar.gz"
server_tar_name="minidsp-server-aarch64-unknown-linux-gnu-gpio.tar.gz"

### handle server
mkdir -p server
cd server
url="${base_url}/${server_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
sudo tar -xzvf /usr/bin/minidsp-ui/${server_tar_name}

### handle nginx folder
mkdir -p nginx

### handle client and nginx conf
mkdir -p client
cd client
url="${base_url}/${ui_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
sudo tar -xzvf /usr/bin/minidsp-ui/${ui_tar_name}
mv dist ../
mv embedded/nginx.conf ../nginx
mv embedded/minidsp-ui.service /storage/.config/system.d/
mv embedded/nginx.service /storage/.config/system.d/
cd ../
rm -r client

### handle nginx
cd nginx
# precompiled nginx binaries
curl -L -O https://raw.githubusercontent.com/jirutka/nginx-binaries/binaries/nginx-1.28.0-aarch64-linux
mv nginx-1.28.0-aarch64-linux nginx
chmod +x nginx
sudo sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
curl -L -O https://raw.githubusercontent.com/nginx/nginx/master/conf/mime.types
cd ..

### handle sqlite
mkdir -p db

### handle ssl
mkdir -p ssl

### start services
systemctl enable /storage/.config/system.d/nginx.service
systemctl enable /storage/.config/system.d/minidsp-ui.service
