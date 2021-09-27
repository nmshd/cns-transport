export CONNECTION_STRING="mongodb://localhost:27020/?readPreference=primary&appname=TransportLib&ssl=false"

docker-compose -f test/docker-compose.yml up -d transportlib-mongo
