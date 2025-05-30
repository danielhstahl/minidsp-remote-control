sudo mkdir -p /etc/ssl/local
sudo openssl genrsa -out /etc/ssl/local/ca.key 2048
sudo openssl req -x509 -new -nodes -key /etc/ssl/local/ca.key -days 3650 -out /etc/ssl/local/ca.crt -subj "/CN=My Local CA"
sudo openssl req -new -nodes -newkey rsa:2048 -keyout /etc/ssl/local/${HOSTNAME}.key -out /etc/ssl/local/${HOSTNAME}.csr -subj "/CN=${HOSTNAME}.local" -addext "subjectAltName=DNS:${HOSTNAME}.local"
sudo openssl x509 -req -in /etc/ssl/local/${HOSTNAME}.csr -CA /etc/ssl/local/ca.crt -CAkey /etc/ssl/local/ca.key -CAcreateserial -out /etc/ssl/local/${HOSTNAME}.crt -days 3650 -out /etc/ssl/local/${HOSTNAME}.crt -days 3650
