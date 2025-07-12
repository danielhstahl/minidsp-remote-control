## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v4.0.2 ./install_script.sh
set -e
base_url="https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}"
ui_tar_name="minidsp-ui.tar.gz"
server_tar_name="minidsp-server-aarch64-unknown-linux-gnu-gpio.tar.gz"
url="${base_url}/${ui_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
url="${base_url}/${server_tar_name}"
echo "downloading from ${url}"
curl -L -O $url
sudo rm -rf /usr/bin/minidsp-ui || true
sudo mkdir /usr/bin/minidsp-ui
sudo mv ${ui_tar_name} /usr/bin/minidsp-ui/
sudo mv ${server_tar_name} /usr/bin/minidsp-ui/
sudo tar -xzvf /usr/bin/minidsp-ui/${ui_tar_name} -C /usr/bin/minidsp-ui
sudo tar -xzvf /usr/bin/minidsp-ui/${server_tar_name} -C /usr/bin/minidsp-ui
# copy services
sudo sed -i -e "s/HOSTNAME/${DOMAIN}/g" /usr/bin/minidsp-ui/nginx.conf
sudo sed -i -e "s/HOSTNAME/${DOMAIN}/g" /usr/bin/minidsp-ui/minidsp-ui.service
sudo apt-get update
sudo apt-get install -y uuid-runtime
uuid=$(uuidgen)
sudo sed -i -e "s/STRING_TO_USE_IF_PRIVATE_KEY_IS_LOST/${uuid}/g" /usr/bin/minidsp-ui/minidsp-ui.service
sudo mv /usr/bin/minidsp-ui/minidsp-ui.service /lib/systemd/system/minidsp-ui.service
sudo mv /usr/bin/minidsp-ui/minidsp-bt.service /lib/systemd/system/minidsp-bt.service
sudo mv /usr/bin/minidsp-ui/nginx.service /lib/systemd/system/nginx.service
sudo mv /usr/bin/minidsp-ui/nginx.conf /home/minidsp/nginx/

sudo npm --prefix /usr/bin/minidsp-ui/ ci
sudo rm /usr/bin/minidsp-ui/${ui_tar_name}
sudo rm /usr/bin/minidsp-ui/${server_tar_name}
echo "completed extraction"
# create user to run the service
echo "user and group setup"
id -u minidsp &>/dev/null || sudo useradd -m minidsp
getent group minidspgroup || sudo groupadd minidspgroup
sudo usermod -aG bluetooth minidsp
sudo usermod -aG gpio minidsp
sudo usermod -aG plugdev minidsp # HID, but is it needed??
sudo usermod -aG input minidsp #HID
sudo usermod -aG minidspgroup minidsp
echo "completed user and group setup"
echo "install dependent software"
sudo apt install nginx
sudo mkdir -p /home/minidsp/nginx
sudo mkdir -p /home/minidsp/ssl
sudo mkdir -p /home/minidsp/db
# update to node 24, only needed for HID/BT
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash
sudo apt-get install nodejs -y

# install package that auto-updates packages
sudo apt-get install -y unattended-upgrades apt-listchanges
echo unattended-upgrades unattended-upgrades/enable_auto_updates boolean true | sudo debconf-set-selections
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

echo "finished installing dependent software"

# add group to /etc/sudoers
if [ -z "$(sudo grep '%minidspgroup ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx' /etc/sudoers )" ]; then echo "%minidspgroup ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" | sudo EDITOR='tee -a' visudo; fi;
# if [ -z "$(sudo grep '%minidspgroup ALL=(ALL) NOPASSWD: /usr/sbin/rfkill unblock bluetooth' /etc/sudoers )" ]; then echo "%minidspgroup ALL=(ALL) NOPASSWD: /usr/sbin/rfkill unblock bluetooth" | sudo EDITOR='tee -a' visudo; fi;

# Reset services
sudo systemctl daemon-reload
sudo systemctl enable minidsp-ui
sudo systemctl enable minidsp-bt
sudo systemctl enable nginx
sudo chown -R  minidsp:minidspgroup /home/minidsp/
