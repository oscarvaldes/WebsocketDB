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
  globalIP='::ffff:';
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
db.connect(function(err) {
  if (!err) {
    console.log('Database is connected ... ');
    console.log("NODE_ENV : ", process.env.NODE_ENV);
  } else {
    console.log('Error connecting database ... ');
  }
})

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

// Define/initialize our global vars
var notes = [],
  initialNotes = false,
  socketCount = 0,
  addresses = [];

io.sockets.on('connection', function(socket) {
    // Socket has connected, increase socket count
    socketCount++;
  //  addresses.length = socketCount;

    //console.log(socket.handshake.address);
    addresses.push(socket.handshake.address);
    //addresses.splice(0,1);
    socket.id=(socket.handshake.address).replace(/::ffff:/g, '');
    // console.log(socket.id)
    // Let all sockets know how many are connected
    //io.sockets.emit('users connected', socketCount)
    io.sockets.emit('users connected', addresses)

    socket.on('disconnect', function() {
      // Decrease the socket count on a disconnect, emit
      //var current;
      socketCount--;

      if(globalIP==='::ffff:'){
        for(var i=0; i< addresses.length;i++){
          if(typeof addresses[i] == 'undefined'){
            addresses.splice(i, 1);
          }
          if(addresses[i]==socket.id){
            console.log('ENTERED!!!');
            addresses.splice(i, 1);
            io.sockets.emit('users connected', addresses);
          }
        }
        console.log(socket.id);
        console.log('do nothing');
        //do nothing
      }
      else{
        for(var i=0; i< addresses.length;i++){
          if(typeof addresses[i] == 'undefined'){
            addresses.splice(i, 1);
          }
          // addresses[i]= addresses[i].replace(/::ffff:/g, '');
          console.log('current '+addresses[i]);
          console.log(globalIP);
          if(addresses[i]===globalIP){
            console.log('Before: '+addresses.length);
            addresses.splice(i, 1);
            console.log(addresses);
            console.log('After: '+addresses.length);
          // socket.emit('disconnect');
            // socket.emit('clientdisconnect');
            globalIP='none';
            break;
          }
        }
      }
      //addresses.length = socketCount + 2;
      io.sockets.emit('users connected', addresses)
    })

    socket.on('query', function(sql, format) {
      var type = format || 'text',
        data = 'true',
        fldnames = 'true';

      db.query(sql, function(err, rows, fields) {
        if (type === 'JSON') {
          socket.emit('create table JSON', json(rows, fields));
        } else if (type === 'text') {
          socket.emit('create table text', text(rows, fields, fldnames, data));
        } else if (type === 'table') {
          socket.emit('create table table', table(rows, fields, fldnames, data));
        }


      }); //query
    })

    socket.on('primary', function(tableName) {
      db.query("SHOW INDEX FROM `agdbmysql`." + tableName + " WHERE `Key_name` = 'PRIMARY';", function(err, rows, fields) {
        var key = rows[0].Column_name;
        socket.emit('key', key);

      });

    })

    socket.on('update', function(changes) {
      //  console.log(statement);
      changes.forEach(function(statement) {
        //console.log(value);
        db.query(statement, function(err, rows, fields) {});

      });


    })

    socket.on('load', function() {
      db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA='agdbmysql' ", function(err, rows, fields) {
        socket.emit('tables', rows);
      });
    })

    socket.on('authenticate', function(password,user) {
      console.log(password);
      if (password !== 'soiltest') {
        admin = false;
        if(user==='user'){

        }
        else{
        socket.emit('exception', 'Error: Wrong Password');
      }
        // socket.emit('verified', 'Admin Succesfully Logged In');
      }
      else {
        admin = true;
        socket.emit('verified', 'Admin Succesfully Logged In');
      }

      console.log('admin log in attempt success: ' + admin);
    })

    socket.on('adminBoot', function(IP) {
      for (var i in io.sockets.connected) {
          var s = io.sockets.connected[i];
          if (s.id === IP) {
            globalIP+=IP;
            // console.log(s.id+' IT WORKED!!')
            s.emit('clientdisconnect');
            console.log(IP+' has been booted by admin');
             break;
          }

      }

    })

    // Initial app start, run db query

  }) //connection



module.exports = router;
