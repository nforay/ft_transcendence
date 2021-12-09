sudo chown -R user42:user42 dbdata
rm -rf dbdata
docker-compose up -d database
docker-compose up -d front
