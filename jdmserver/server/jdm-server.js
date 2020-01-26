let iconv = require("iconv-lite");
var express = require("express");
var cheerio = require("cheerio");
var mkdirp = require("mkdirp");
var https = require('https');
var cors = require("cors");
var fs = require("fs");
var app = express();
var utils = require('./../lib/utils');
app.use(cors());

let response = {
  status: 200,
  data: [],
  message: null
};

app.get("/", function(req, res) {
  res.end("Bonjour");
});

app.get("/auto-compl/:characters", function(req, res) {
  var characters = req.params.characters;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  utils.getAutoCompl(characters, function(terms) {
    console.log(terms);
    res.json(terms);
  });
});

app.get("/loadTerm/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.loadTerm(term, (error) => {
    if(error) {
      console.error(error);
      response.data.push({ status: 'error', data: error});
      res.json(response);
    } else {
      response.data.push({ status: 'done', data: 'Loading...'});
      res.json(response);
    }
  });
});

app.get("/getInfos/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.getTermInfos(term, (error, json) => {
    if(error) {
      response.data.push({ status: 'error', data: error});
      res.json(response);
    } else {
      res.json(JSON.parse(json));
    }
  });
});

app.get("/getDefinitions/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.getTermDefinitions(term, (error, json) => {
    if(error) {
      response.data.push({ status: 'error', data: error});
      res.json(response);
    } else {
      res.json(JSON.parse(json));
    }
  });
});

app.get("/getTypes/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.getTermRelationshipsTypes(term, (error, json) => {
    if(error) {
      response.data.push({ status: 'error', data: error});
      res.json(response);
    } else {
      res.json(JSON.parse(json));
    }
  });
});

app.get("/getIncomings/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.getTermIncomingsRelationships(term, (error, json) => {
    if(error) {
      response.data.push({ status: 'error', data: error});
      res.json(response);
    } else {
      res.json(JSON.parse(json));
    }
  });
});

app.get("/getOutgoings/:term", function(req, res) {
  var term = req.params.term;
  response.data = [];
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // On recherche les définitions du terme demandé
  utils.getTermOutgoingsRelationships(term, (error, json) => {
    if(error) {
      response.data.push({ status: 'error', data: error});
      res.json(esponse);
    } else {
      res.json(JSON.parse(json));
    }
  });
});

app.get('*', function(req, res){
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(404).send('<style>body {background: #222533; color: white; font-family: -apple-system, BlinkMacSystemFont, sans-serif;}</style><div style="text-align:center; margin-top: 50vh; transform: translateY(-50%);"><h1>Error 404</h1><br/>Routes not found</div>');
});

app.listen(3000);