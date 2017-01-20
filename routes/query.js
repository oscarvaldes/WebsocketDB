var express = require('express'),
    mysql = require('mysql'),
    fs = require('fs'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    path = require('path'),
    moment = require('moment'),
    tableName,
    connection;
    var io = require('socket.io').listen(8080);

router.use(bodyParser.urlencoded({
  extended: true
}));


// Define our db creds
var db = mysql.createConnection({
  host: 'soiltest',
  user: 'root',
  password: 'Blue$apph1re#2',
  database: 'agdbmysql'
})

// Log any errors connected to the db
db.connect(function(err){
  if (!err) {
  console.log('Database is connected ... ');
  console.log("NODE_ENV : ", process.env.NODE_ENV);
} else {
  console.log('Error connecting database ... ');
}
})

function fldValue(row, fld) {
  var val = row[fld.name];

  if(fld.type === 12) {  //datetime
    return moment(val).format('MM/DD/YYYY');
  } else if(val === null) {
    return '';
  } else {
    return val;
  }
} //fldValue

function text(rows, fields, fldnames, data) {
  var s = '';

  if(fldnames) {
    fields.forEach(function(fld) {  //field names
      s += fld.name + '|';
    });
    s += '\n';
  }

  if(data) {
    rows.forEach(function(row) {   //data
      fields.forEach(function(fld) {
        s += fldValue(row, fld) + '|';
      });
      s += '\n';
    });
  }

  return s;
} //text

function table(rows, fields, fldnames, data) {
  var s = '<table><tr>';

  if(fldnames) {
    fields.forEach(function(fld) {
      s += '<th>' + fld.name;
    });
  }

  if(data) {
    rows.forEach(function(row) {
      s += '<tr>';
      fields.forEach(function(fld) {
        s += '<td>' + fldValue(row, fld);
      });
    });
  }
  s += '</table>';

  return s;
} //table

function json(rows, fields) {
  rows.forEach(function(row) {
    fields.forEach(function(fld) {
      row[fld.name] = fldValue(row, fld);
    });
  });

  return JSON.stringify(rows);
} //json

// Define/initialize our global vars
var notes = []
var initialNotes = false
var socketCount = 0

io.sockets.on('connection', function(socket){
    // Socket has connected, increase socket count
    socketCount++
    // Let all sockets know how many are connected
    io.sockets.emit('users connected', socketCount)

    socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users connected', socketCount)
    })

    socket.on('query',function(sql,format){
      var type = format || 'text',
      data = 'true',
      fldnames= 'true';

      db.query(sql, function(err, rows, fields) {
        if(type==='JSON'){
        socket.emit('create table JSON',json(rows, fields));
      }
        else if(type==='text'){
        socket.emit('create table text',text(rows, fields, fldnames, data));
        }
        else if(type === 'table') {
        socket.emit('create table table',table(rows, fields, fldnames, data));
        }


      });//query
    })

    socket.on('primary',function(tableName){
      db.query("SHOW INDEX FROM `agdbmysql`."+tableName+" WHERE `Key_name` = 'PRIMARY';", function(err, rows, fields) {
      var key = rows[0].Column_name;
      socket.emit('key',key);

      });

    })

    socket.on('update',function(statement){
    //  console.log(statement);
      db.query(statement, function(err, rows, fields) {

      });

      })

        // Initial app start, run db query

})//connection



module.exports = router;
