const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require('node-fetch');

const postsRoutes = require("./routes/posts");
const userRoutes = require("./routes/user");

const app = express();

app.enable('trust proxy');

mongoose
  .connect(
    "mongodb+srv://Viktor:" +
    process.env.MONGO_ATLAS_PW +
    "@cluster0.yivkoun.mongodb.net/test?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to database!");
  })
  .catch(() => {
    console.log("Connection failed!");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/", express.static(path.join(__dirname, "angular")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/posts", postsRoutes);
app.use("/api/user", userRoutes);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

async function getDataAboutNBUExchange() {
  let dataAboutNBUExchange;
  const urlNBU = 'https://bank.gov.ua/NBU_Exchange/exchange_site?&valcode=usd&sort=exchangedate&order=desc&json';
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const formattedToday = dd + '.' + mm + '.' + yyyy;
  const bodyNBU = { "r030": 840, "txt": "Долар США", "cc": "USD", "exchangedate": `${formattedToday}` };
  await fetch(urlNBU, { method: 'GET', body: JSON.stringify(bodyNBU) }).then((response) => {
    return response.json();
  })
    .then((data) => {
      dataAboutNBUExchange = data;
    }).catch(function (err) {
      console.log("Promise https://bank.gov.ua Rejected" + err);
    });

  return dataAboutNBUExchange || {};
}

async function gaCollect(dataForGoogleAnalytics) {
  const rate = dataForGoogleAnalytics[0].rate;

  if (rate) {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${ process.env.MEASUREMENT_ID }&api_secret=${ process.env.API_SECRET }`, {
      method: "POST",
      body: JSON.stringify({
        "client_id": "595076620.1662328068",
        "events": [{
          "name": "exchange_rate",
          "params": {
            "currency": "USD",
            "value": `${rate}`,
          }
        }]
      })
    }).then(function () {
      console.log("Sended to google-analytics exchange_rate (uah/usd) " + rate);
    }).catch(function (err) {
      console.log("Promise google-analytics Rejected" + err);
    });
  }
}
const periodInOneDay = 10000;
setInterval(async function () {
  const dataForGoogleAnalytics = await getDataAboutNBUExchange()
  gaCollect(dataForGoogleAnalytics).then(function () {
    // console.log("Promise gaCollect Resolved");
  }).catch(function (err) {
    console.log("Promise gaCollect Rejected" + err);
  });;
}, periodInOneDay);

module.exports = app;
