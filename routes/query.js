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
  globalIP='none';
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
  addresses = [],
  socketarray=[];

io.sockets.on('connection', function(socket) {
    // Socket has connected, increase socket count
    socketCount++;
  //  addresses.length = socketCount;

    //console.log(socket.handshake.address);
    addresses.push(socket.handshake.address);
      for(var i=0; i< addresses.length;i++){
        addresses[i]= addresses[i].replace(/::ffff:/g, '');
        }
    //addresses.splice(0,1);
    socket.id=(socket.handshake.address).replace(/::ffff:/g, '');
    socketarray.push(socket);
    //console.log(socketarray.length);
    // console.log(socket.id)
    // Let all sockets know how many are connected
    //io.sockets.emit('users connected', socketCount)
    io.sockets.emit('users connected', addresses)

    socket.on('disconnect', function() {
      // Decrease the socket count on a disconnect, emit
      //var current;
      socketCount--;
      for(var i=0;i<addresses.length;i++){
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
      for (var i in socketarray) {
          var s = socketarray[i];
          console.log('test: '+s.id);
          if (s.id === IP) {
            globalIP=IP;
            // console.log(s.id+' IT WORKED!!')
            console.log('globalIP: '+globalIP);
            // io.sockets.connected.splice(i,1);
            s.emit('clientdisconnect');
            //socketarray.splice(i,1);
            console.log(IP+' has been booted by admin');
        //    console.log(socketCount);
        //    console.log(socketIO.engine.clientsCount);
             break;
          }

      }

    })

    // Initial app start, run db query

  }) //connection



module.exports = router;
