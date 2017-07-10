var fs = require('fs');
var data = fs.readFileSync('./models/dblink.json');
var dblink = JSON.parse(data);
var http = require('http');
var https = require('https');
var moment = require('moment');
var mongoose = require('mongoose');
var config = require('./config');

mongoose.connect(config.mongoUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 // we're connected!
 console.log("Connected correctly to server");
});
var flag;

var express = require('express'),
 path = require('path'),
 streams = require('./app/streams.js')();

var favicon = require('serve-favicon'),
 logger = require('morgan'),
 methodOverride = require('method-override'),
 bodyParser = require('body-parser'),
 errorHandler = require('errorhandler');

var options = {
 key: fs.readFileSync('privkey.pem'),
 cert: fs.readFileSync('cert.pem')
};


var app = express();
var base64id = require('base64id');

// all environments
//app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
 extended: true
}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));



var Info = require('./models/Info');
//var count=1;
//var x;
//var cl;

var server = http.createServer(app).listen(6000);
var server1 = https.createServer(options, app).listen(6443);

var io = require('socket.io').listen(server1);

console.log('server running on 6443');


app.get('/link', function(request, response) {
 var cId = base64id.generateId();
 response.status(200).json({
  "linkid": cId
 });
});

app.post('/add', function(request, response) {

 Info.inform.find({
  "name": request.body.name
 }, function(err, inf) {
  if (err) {
   return console.log(err);
  }
  if (!inf.length) {
   Info.inform.create(request.body, function(err, inf) {
    //module.exports.clink=inf.link;
    //console.log(inf.link);
    if (err) return respond.status(400).send(err);
    inf.save(function(err, inf) {
     if (err) return response.status(400).send(err);
     console.log("success");
     response.status(200).send("successfully submitted");
    });
   });
  } else {
   return response.status(400).send("id exists");
  }

 });
});
app.post('/Matching/inf', function(request, response) {
 Info.inform.find({
  "name": request.body.name
 }, function(err, inf) {
  if (err) {
   return console.log(err);
  }
  if (inf.length) {
   Info.inform.find({
    "name": request.body.name,
    "hour": moment().format('hh'),
    "min": {
     $lte: (moment().format('mm'))
    },
    "meridiem": moment().format('a'),
    "year": moment().format('YYYY'),
    "month": moment().format('MM'),
    "date": moment().format('DD')
   }, function(err, infos) {

    if (err)
     return response.status(400).send("error");
    if (infos.length) {

     for (var i = 0; i < dblink.length; i++) {
      dblink.splice(dblink[i].link, 1);
      fs.writeFileSync('./models/dblink.json', JSON.stringify(dblink), function(err) {
       if (err) console.log(err);

      });
     }

     console.log("success");
     //response.json(inf.link);
     for (var i = 0; i < dblink.length; i++) {
      if (dblink[i].link == infos[0].toObject().link) {
       return response.status(301).json({
        "err": "name already exists"
       });
       var flag = 1;

      }
     }
     if (flag != 1) {
      dblink.push({
       "link": infos[0].toObject().link
      });
     }
     response.json(infos[0].toObject().link);
     var link = infos[0].toObject().link;
     data = JSON.stringify(dblink);
     fs.writeFile('./models/dblink.json', data, finished);

     function finished(err) {
      console.log('all set.');
      reply = {
       link: link
      }
     }
    } else {
     response.status(400).send("time doesnt match");
    }


   }).select({
    "link": 1,
    "_id": 0
   });


  } else {
   response.status(400).send("id doesnot exist")
  }


 });



});




// development only
if ('development' == app.get('env')) {
 app.use(errorHandler());
}

// routing
require('./app/routes.js')(app, streams);


/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);