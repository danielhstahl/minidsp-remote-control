if [ -z "$1" ]
then
  echo "Please supply a subdomain to create a certificate for";
  echo "e.g. www.mysite.com"
  exit;
fi

sed -i -e "s/HOSTNAME/${HOSTNAME}/g" examples/nginx
sudo cp examples/nginx /etc/nginx/sites-available/$HOSTNAME
sudo ln -s /etc/nginx/sites-available/${HOSTNAME} /etc/nginx/sites-enabled/ || true
sudo systemctl restart nginx
