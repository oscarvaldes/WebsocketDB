var express = require('express'),
    mysql = require('mysql'),
    fs = require('fs'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    path = require('path'),
    moment = require('moment'),
    tableName,
    connection,
    admin = false,
    globalIP = 'none',
    io = require('socket.io').listen(8080),
    db = mysql.createConnection({
           host: 'soiltest',
           user: 'root',
           password: 'Blue$apph1re#2',
           database: 'agdbmysql'
         });
    notes = [],
    initialNotes = false,
    socketCount = 0,
    addresses = [],
    socketarray = [];

router.use(bodyParser.urlencoded({
  extended: true
}));

// Define our db creds

// Log any errors connected to the db
db.connect(function(err) {
  if (!err) {
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log(' ');
    console.log('____________________________________________________________________');
    console.log('Database is connected ... ');
    console.log("NODE_ENV : ", process.env.NODE_ENV);
  } else {
    console.log('Error connecting database ... ');
  }
}); //db.connect

function fldValue(row, fld) {
  var val = row[fld.name];

  if (fld.type === 12) { //datetime
    return moment(val).format('MM/DD/YYYY');
  } else if (val === null) {
    return '';
  } else {
    return val;
  }
} //fldValue

function text(rows, fields, fldnames, data) {
  var s = '';

  if(!fields) return;

  if (fldnames) {
    fields.forEach(function(fld) { //field names
      s += fld.name + '|';
    });
    s += '\n';
  }

  if (data) {
    rows.forEach(function(row) { //data
      fields.forEach(function(fld) {
        s += fldValue(row, fld) + '|';
      });
      s += '\n';
    });
  }

  return s;
} //text

function table(rows, fields, fldnames, data) {
  var s = '<table><tr class="header">';

  if (fldnames) {
    fields.forEach(function(fld) {
      s += '<th>' + fld.name;
    });
  }

  if (data) {
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

io.sockets.on('connection', function(socket) {
  // Socket has connected, increase socket count
  socketCount++;

  addresses.push(socket.handshake.address);
  for(var i=0; i< addresses.length; i++) {
    addresses[i]= addresses[i].replace(/::ffff:/g, '');
  }

  socket.id=(socket.handshake.address).replace(/::ffff:/g, '');
  socketarray.push(socket);

  // Let all sockets know how many are connected
  io.sockets.emit('users connected', addresses);

  socket.on('disconnect', function() {
    // Decrease the socket count on a disconnect, emit
    socketCount--;
    for(var i=0;i<addresses.length;i++) {
      if(globalIP===addresses[i]){
        addresses.splice(i, 1);
        socketarray.splice(i,1);
        break;
      }
      if(globalIP==='none'){
        if(addresses[i]===socket.id){
          addresses.splice(i,1);
          socketarray.splice(i,1);
          break;
        }
      }
    }
    console.log(addresses);
    globalIP='none';
    io.sockets.emit('users connected', addresses)
  }); //socket.on disconnect

  socket.on('query', function(sql, format) {
    var type = format || 'text',
        data = 'true',
        fldnames = 'true';

    console.log(sql, ': ' , format);
    db.query(sql, function(err, rows, fields) {
      console.log(err);
      if (type === 'JSON') {
        socket.emit('create table JSON', json(rows, fields));
      } else if (type === 'text') {
        socket.emit('create table text', text(rows, fields, fldnames, data));
      } else if (type === 'table') {
        socket.emit('create table table', table(rows, fields, fldnames, data));
      } else if (type === 'info') {
        console.log(json(rows, fields));
        socket.emit('info', json(rows, fields));
      }
    }); //query
  }); //socket.on query

  socket.on('primary', function(tableName) {
    db.query("SHOW INDEX FROM `agdbmysql`." + tableName + " WHERE `Key_name` = 'PRIMARY';", function(err, rows, fields) {
      var key = rows[0].Column_name;
      socket.emit('key', key);
    });
  }); //socket.on primary

  socket.on('update', function(changes) {
    changes.forEach(function(statement) {
      db.query(statement, function(err, rows, fields) {});
    });
  }); //socket.on update

  socket.on('load', function() {
    db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA='agdbmysql' ", function(err, rows, fields) {
      socket.emit('tables', rows);
    });
  }); //socket.on load

  socket.on('authenticate', function(password,user) {
    console.log(password);
    if (password !== 'soiltest') {
      admin = false;
      if(user !== 'user'){
        socket.emit('exception', 'Error: Wrong Password');
      }

    }
    else {
      admin = true;
      socket.emit('verified', 'Admin Succesfully Logged In');
    }

    console.log('admin log in attempt success: ' + admin);
  }); //socket.on authenticate

  socket.on('adminBoot', function(IP) {
    for (var i in socketarray) {
      var s = socketarray[i];
      console.log('test: '+s.id);
      if (s.id === IP) {
        globalIP=IP;
        console.log('globalIP: '+globalIP);
        s.emit('clientdisconnect');
        console.log(IP+' has been booted by admin');
         break;
      }
    }
  }); //socket.on adminBoot
}); //connection

module.exports = router;
