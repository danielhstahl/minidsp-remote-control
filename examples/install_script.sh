## example of running this script: RELEASE_TAG=v1.0.2 ./install_script.sh
curl -L -O https://github.com/danielhstahl/minidsp-remote-control/releases/download/${RELEASE_TAG}/minidsp-ui.tar.gz
sudo rm -rf /usr/bin/minidsp-ui || true
sudo mkdir /usr/bin/minidsp-ui
sudo mv minidsp-ui.tar.gz /usr/bin/minidsp-ui/
sudo tar -xzvf /usr/bin/minidsp-ui/minidsp-ui.tar.gz -C /usr/bin/minidsp-ui
sudo npm --prefix /usr/bin/minidsp-ui/ ci
sudo rm /usr/bin/minidsp-ui/minidsp-ui.tar.gz