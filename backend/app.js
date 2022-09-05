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
// app.use("/images", express.static(__dirname + "/images"));
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
  const bodyNBU = { "r030":840,"txt":"Долар США","cc":"USD","exchangedate": `${ formattedToday }`};
  await fetch(urlNBU,{method: 'GET', body: JSON.stringify(bodyNBU)}).then((response) => {
    return response.json();
  })
  .then((data) => {
    dataAboutNBUExchange = data;
  });

  return dataAboutNBUExchange || {};
}

async function gaCollect(dataForGoogleAnalytics){
  const rate = value[0].rate || 0;
  const body = { "ea":"exchange_rate", "ec":"current_uah_usd_ratio","el":"exchange_rate_label","ev":`${ rate }`}
  const url = `http://www.google-analytics.com/collect?v=2&tid=${ process.env.MONGO_ATLAS_PW }`
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
const periodInOneDay = 24 * 60 * 60 * 1000;
setInterval (function () {
  const dataForGoogleAnalytics = await getDataAboutNBUExchange();
  gaCollect(dataForGoogleAnalytics);
}, period)

module.exports = app;
