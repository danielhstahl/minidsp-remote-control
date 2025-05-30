sudo apt install nginx
sed -i -e "s/HOSTNAME/${HOSTNAME}/g" examples/nginx
sudo cp examples/nginx /etc/nginx/sites-available/$HOSTNAME
sudo ln -s /etc/nginx/sites-available/${HOSTNAME} /etc/nginx/sites-enabled/
sudo systemctl restart nginx
