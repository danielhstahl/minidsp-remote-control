## example of running this script: DOMAIN=raspberrypi.local RELEASE_TAG=v1.0.2 ./install_script.sh
curl -L -O https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}/minidsp-ui.tar.gz
sudo rm -rf /usr/bin/minidsp-ui || true
sudo mkdir /usr/bin/minidsp-ui
sudo mv minidsp-ui.tar.gz /usr/bin/minidsp-ui/
sudo tar -xzvf /usr/bin/minidsp-ui/minidsp-ui.tar.gz -C /usr/bin/minidsp-ui
sudo npm --prefix /usr/bin/minidsp-ui/ ci
sudo rm /usr/bin/minidsp-ui/minidsp-ui.tar.gz
# create user to run the service
sudo useradd -m minidsp
sudo groupadd minidspgroup
sudo usermod -aG bluetooth minidsp
sudo usermod -aG gpio minidsp
sudo usermod -aG plugdev minidsp
#sudo usermod -aG minidspgroup minidsp
sudo apt install nginx
mkdir -p /home/minidsp/nginx
mkdir -p /home/minidsp/ssl
# update to node 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash
sudo apt-get install nodejs -y

# add group to /etc/sudoers
#if [ -z "$(sudo grep 'Cmnd_Alias MINIDSP_CMNDS = /bin/systemctl reload nginx' /etc/sudoers )" ]; then echo "Cmnd_Alias MINIDSP_CMNDS = /bin/systemctl reload nginx" | sudo EDITOR='tee -a' visudo; fi;
#if [ -z "$(sudo grep 'minidspgroup ALL=(ALL) NOPASSWD: MINIDSP_CMNDS' /etc/sudoers )" ]; then echo "minidspgroup ALL=(ALL) NOPASSWD: MINIDSP_CMNDS" | sudo EDITOR='tee -a' visudo; fi;
sed -i -e "s/HOSTNAME/${DOMAIN}/g" nginx.conf
sed -i -e "s/HOSTNAME/${DOMAIN}/g" minidsp-ui.service
# copy services
sudo cp minidsp-ui.service /lib/systemd/system/minidsp-ui.service
sudo cp minidsp-bt.service /lib/systemd/system/minidsp-bt.service
sudo cp nginx.service /lib/systemd/system/nginx.service
cp nginx.conf /home/minidsp/nginx/
sudo systemctl daemon-reload
sudo systemctl enable minidsp-ui
sudo systemctl enable minidsp-bt
sudo systemctl enable nginx
