## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v4.0.2 ./install_script.sh
set -e
url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}/minidsp-ui.tar.gz"
echo "downloading from ${url}"
curl -L -O $url
sudo rm -rf /usr/bin/minidsp-ui || true
sudo mkdir /usr/bin/minidsp-ui
sudo mv minidsp-ui.tar.gz /usr/bin/minidsp-ui/
sudo tar -xzvf /usr/bin/minidsp-ui/minidsp-ui.tar.gz -C /usr/bin/minidsp-ui
sudo npm --prefix /usr/bin/minidsp-ui/ ci
sudo rm /usr/bin/minidsp-ui/minidsp-ui.tar.gz
echo "completed extraction"
# create user to run the service
echo "user and group setup"
id -u minidsp &>/dev/null || sudo useradd -m minidsp
getent group minidspgroup || sudo groupadd minidspgroup
sudo usermod -aG bluetooth minidsp
sudo usermod -aG gpio minidsp
sudo usermod -aG plugdev minidsp
sudo usermod -aG minidspgroup minidsp
echo "completed user and group setup"
echo "install dependent software"
sudo apt install nginx
mkdir -p /home/minidsp/nginx
mkdir -p /home/minidsp/ssl
# update to node 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash
sudo apt-get install nodejs -y
echo "finished installing dependent software"

# add group to /etc/sudoers
if [ -z "$(sudo grep '%minidspgroup ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx' /etc/sudoers )" ]; then echo "%minidspgroup ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" | sudo EDITOR='tee -a' visudo; fi;

sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
sed -i -e "s/HOSTNAME/${DOMAIN}/g" minidsp-ui.service
# copy services
sudo cp minidsp-ui.service /lib/systemd/system/minidsp-ui.service
sudo cp minidsp-bt.service /lib/systemd/system/minidsp-bt.service
sudo cp nginx.service /lib/systemd/system/nginx.service
sudo cp nginx.conf /home/minidsp/nginx/
sudo systemctl daemon-reload
sudo systemctl enable minidsp-ui
sudo systemctl enable minidsp-bt
sudo systemctl enable nginx
sudo chown -R  minidsp:minidspgroup /home/minidsp/
