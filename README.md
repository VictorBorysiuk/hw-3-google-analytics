How to use
----------

1. Run "npm install" inside this project folder to install all dependencies.
2. Run backend "npm run start:server" and follow on "http://localhost:7000/".
3. In nodemon.json you can change MEASUREMENT_ID and API_SECRET for your own values.
4. In backend/app.js located worcker (getDataAboutNBUExchange and gaCollect functions);
5. For run siege to use command: docker run --rm -it -v "%cd%:/app" ecliptik/docker-siege -t10s -c 5 -f /app/docker-siege/urls.txt -R /app/docker-siege/siege.conf 