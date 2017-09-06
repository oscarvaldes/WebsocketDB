'use strict';

$(function() {
  if(window.name ==='admin'){
    console.log('do the set up here');
    // socket.emit('admin-refresh');
  }
  var DEBUG_MODE=false;
//________________________________________________________________________________________________________________________
  function socketEvents() {
    socket.on('verified', function(message) { //Admin login success
      window.name='admin';
      $('#edit').show();
      $('#query').show();
      $('.main').show();

      $('#Users, button.user').removeClass('disabled');
      $('#Users, button.user').prop('disabled', false);

      $('button.admin').addClass('disabled');
      $('button.admin').prop('disabled', true);

      $('.bootbox, .modal-backdrop').remove();

      bootbox.alert(message, function() {
        $('body').removeClass('modal-open');
        $('.bootbox, .modal-backdrop').remove();
      });
    }); //verified

    socket.on('exception', function(message) { //Admin login failed
      window.name='';
      if(!$('button.user').hasClass('active')) {
        $('button.user').click();
        $('button.admin').removeClass('selected');
      }

      $('.bootbox, .modal-backdrop').remove();

      bootbox.alert(message, function() {
        $('body').removeClass('modal-open');
        $('.bootbox, .modal-backdrop').remove();
        console.error('Failed Authentification');
      });
    }); //exception

    // New socket connected, display new count on page
    socket.on('users connected', function(data) {
      var list,
          addresses = [];

      $('.dropdown-menu').empty();

      $.each(data, function(key, value) {
        if(value != null) {
          addresses.push(value.replace(/::ffff:/g, ''));
        }
      });

      $('#Users').html('<i class="material-icons" style="font-size:18px;">group</i>' + addresses.length);

      $.each(addresses, function(i) {
        $('.dropdown-menu').append('<li>' + addresses[i] + ' <i class="material-icons exit" style="font-size:18px;">close</i>' + '</li>');
      });

      $('.exit').each(function(idx, li) {
        var IP = $(this).closest('li').text().slice(0, -6);
        $(this).data('IP', IP);
      });
    }); //users connected

    socket.on('clientdisconnect', function(data) {
      socket.disconnect();
      DEBUG_MODE ? console.log('DISCONNECT'):'';
      $('#warning-alert').show();
    }); //clientdisconnect

    socket.on('create table text', function(data) {
      if(!data) return;
      var sql = $('#query').val(),
          rows = data.split('\n'),
          s = '<table>',
          time1 = new Date() - timer,
          time2;

      s += '<tr class="header"><th>' + rows[0].replace(/\|/g, '<th>');
      rows.shift();
      s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
      $('#data').html(s);
      $('#data table th:last-child, #data table td:last-child').remove(); //remove extraneous last column

      $('#data tr:empty').remove();

      checkOrder(sql);

      time2 = new Date() - timer - time1;
      DEBUG_MODE ? console.log('text: Received:' + time1 + '   Rendered:' + time2 + '   Total:' + (time1 + time2)):'';
    }); //create table text

    socket.on('create table JSON', function(data) {
      var sql = $('#query').val(),
          s = '<table>',
          flds,
          time1 = new Date() - timer,
          time2;

      if(data == '[]') {
        return;
      }

      data = JSON.parse(data);
      DEBUG_MODE ? console.log(JSON.stringify(query, null, 2)):'';

      flds = Object.keys(data[0]);

      s += '<tr class="header">';
      flds.forEach(function(fld) {
        s += '<th>' + fld;
      });

      data.forEach(function(row) {
        s += '<tr>';
        flds.forEach(function(fld) {
          s += '<td>' + row[fld];
        });
      });

      s += '</table>';

      $('#data').html(s);
      checkOrder(sql);

      time2 = new Date() - timer - time1;
      DEBUG_MODE ? console.log('json: Received:' + time1 + '   Rendered:' + time2 + '   Total:' + (time1 + time2)):'';
    }); //create table JSON

    socket.on('create table table', function(data) {
      var sql = $('#query').val(),
          time1 = new Date() - timer,
          time2;

      $('#data').html(data);

      checkOrder(sql);

      time2 = new Date() - timer - time1;
      DEBUG_MODE ? console.log('table: Received:' + time1 + '   Rendered:' + time2 + '   Total:' + (time1 + time2)):'';
    }); //create table table

    socket.on('info', function(data) {
      var sq,
          total = 0,
          style = '<style>';

      data = JSON.parse(data);
      DEBUG_MODE ? console.log(JSON.stringify(data, null, 2)):'';

      if('RECORDS' in data[0]) {
        sq = data[0].TABLE + ' order by `' + data[0].FIELD + '` limit ' + pageHeight + ' offset ' + Math.min(data[0].RECORDS, recordCount - pageHeight);
        $('#query').val(sq);
        goto(position[0], 1);
        socket.emit('query', sq);
      } else if(data[0].RECORDCOUNT) {
        recordCount = data[0].RECORDCOUNT;
      } else if(data[0].Field) {
        data.forEach(function(col, idx) {
          var field = col.Field,
              type = col.Type,
              width = Math.max(col.Field.length, type.match(/\d+/) || 7),
              align = /varchar/.test(type) ? 'left' : 'right';

          dataType[field] = type;

          total += +width;
          style += `th:nth-child(${idx + 1}) {
                      width: ${width}em;
                    }

                    td:nth-child(${idx + 1}) {
                      text-align: ${align};
                    }
                  `;
        });

        style += `table {
                    width: ${total}em;
                  }
                  </style>
                 `;

        $('body').append(style);
        createTable();
      }
    }); //create table query

    socket.on('tables', function(rows) {
      $.each(rows, function(key, value) {
        $.each(value, function(key, value) {
          var button = $('<button class="tables btn btn-default">' + value + '</button>');
          $('#database').append(button);
        });
      });
    }); //tables

    socket.on('key', function(key) {
      primaryKey = key;
    }); //key
  } //socketEvents
//________________________________________________________________________________________________________________________
  function events() {
    $(document).keydown(function(e) {
      if(e.which==116){
        console.log('refresh');
      }
    });
    $(document).on('input', '.edit', function() {
      var th = $('#data th').eq($(this).index()), // returns text of respective header
          value = "'" + $(this).text() + "'",
          name,
          id,
          tableName,
          matches,
          idCounter=0;

          $('th').each(function() {
            if($(this).text()===primaryKey){
              return false;
            }
            else{
              idCounter++;
            }
          });

          id = $(this).closest('tr').find('td:eq('+  idCounter.toString()+')').text(),

      $(this).css('background-color', 'orange');
      $(this).addClass('updated');

      if (value === "''") {
        value = 'NULL';
      }

          tableName = $('#query').val(),
          matches = /from (.*?) /g.exec(tableName);

      if (matches.length > 1) {
        name = matches[1];
      } else {
        console.error('There is an error in your SQL statement');
      }

      $(this).data('sql', 'UPDATE ' + name + ' SET ' + th.text() + '=' + value + ' WHERE ' + primaryKey + '= ' + id);
    }); //document on input edit

    $('.btn-toggle').click(function() {
      $(this).find('.btn').toggleClass('active');

      if ($(this).find('.btn-primary').size() > 0) {
        $(this).find('.btn').toggleClass('btn-primary');
      }

      $(this).find('.btn').toggleClass('btn-default');
    }); //.btn-toggle click

    $('#query').on('input', function(e) {
      if($('#query').val()) {
        $('button.main.btn.btn-default').removeClass('disabled');
        $('button.main.btn.btn-default').prop('disabled', false);
      } else {
        $('button.main.btn.btn-default').removeClass('selected');
        $('button.main.btn.btn-default').addClass('disabled');
        $('button.main.btn.btn-default').prop('disabled', true);
      }
    }); //#query input

    $(document).on('click', 'button.btn.btn-default.tables', function(event) {
      $('button.btn.btn-default').removeClass('disabled');
      $('button.btn.btn-default').prop('disabled', false);
      $('#inputfilter').prop('disabled', false);
    }); //document click button.btn.btn-default.tables

    $('button#displaydb').click(function(event) {
      $('button.tables.btn.btn-default').slideToggle("slow", function() {
        // Animation complete.
      });
    }); //button#displaydb click

    $('#data').on('click', 'th', function() {
      order($(this).index() + 1);
    }); //#data on click th

    $('button[title="Send Query"]').click(function() {
      $('button[title="Send Query"]').removeClass('selected');
      $(this).addClass('selected');

      createTable();
    });

    $(document).on('click', 'button.tables', function(event) {
      var sql = `select * from ${$(this).text()} limit ${pageHeight} offset 0`,
          matches = /from (.*?) /g.exec(sql),
          res = sql.replace(matches[1], $(this).text());
          sql = res;

      $('button.tables').each(function() {
        $(this).css('background-color', '');
        $(this).removeClass('selected');
      });

      $('button.main.btn.btn-default').removeClass('disabled');
      $('button.main.btn.btn-default').prop('disabled', false);
      $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');

      $('#query').val(sql);
      createTable();
    });

    $(document).on('click', 'button', function(event) {
      if ($('button').hasClass('tables')) {} else {
        $('button').removeClass('selected');
      }
      $(this).addClass('selected');
      $('#displaydb').removeClass('selected');
      $('#Users').removeClass('selected');
    });

    $('button.editTable').click(function(event) {
      //send update request
      if ($('button.editTable').text() === 'save') {
        $('.updated').each(function() {
          changes.push($(this).data('sql'));
          $(this).removeData('sql');
          $(this).prop('style', false); //JS
          $(this).removeClass('updated');
        });
        console.log(changes);
        socket.emit('update', changes);
        changes = [];
        $('td').attr('contenteditable', 'false');
        $('td').removeClass('edit');
        $("#success-alert").alert();
        $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
          $("#success-alert").slideUp(500);
        });
        $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
        $('button.editTable').removeClass('selected');
      } else {
        $('td').attr('contenteditable', 'true');
        $('td').addClass('edit');
        $('button.editTable').html('<i class="material-icons" style="font-size:18px; color:#757575;">save</i>');

        $('.edit').click(function() {
          var tableName = $('#query').val(),
              matches = /from (.*?) /g.exec(tableName),
              value;

          if (matches.length > 1) {
            var name = matches[1];
          } else {
            console.error('There is an error in your SQL statement');
          }
          socket.emit('primary', name);
        });

      } //tohere
    });  //button.editTable click

    // $('.entireTable').click(function() {
    //   var tableName = $('#query').val(),
    //       matches = /from (.*?) /g.exec(tableName),
    //       value;
    //   if (matches.length > 1) {
    //     var name = matches[1];
    //   } else {
    //     console.error('There is an error in your SQL statement');
    //     // Not Found
    //   }
    //   if ($('button.editTable').text() === 'save') {
    //     bootbox.confirm("Warning continuing before saving will discard your changes, are you sure?", function(result) {
    //       if (result == false) {
    //         //do nothing
    //       } else {
    //         $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    //         sql = 'select * from ' + name;
    //         createTable(sql);
    //       }
    //     })
    //   } else {
    //     createTable('select * from ' + name);
    //   }
    // }); //.entireTable click

    $('button.admin').click(function() {
      function sendpassword(result) {
        if (result) {
          socket.emit('authenticate', result, 'admin');
          $('button.admin').addClass('selected');
          $('button.user').removeClass('selected')
        } else {
          $('button.user').click();
          $('button.admin').removeClass('selected');
          socket.emit('authenticate', result, 'user');
          console.error('No password');
        }
      }

      function sendinfo(callback) {
        bootbox.prompt({
          title: "Authentification Required",
          inputType: 'password',
          callback: function(result) {
            if (callback) {
              callback(result);
            }
          }
        });
      }
      sendinfo(sendpassword);
    }); //button.admin click

    $('button.user').click(function(event) {
      window.name='';
      $('#edit').hide();
      $('#query').hide();
      $('.main').hide();
      $('#Users').addClass('disabled');
      $('#Users').prop('disabled', true);
      $('button.admin').removeClass('disabled');
      $('button.admin').prop('disabled', false);
      $('button.user').addClass('disabled');
      $('button.user').prop('disabled', true);
      $('button.user').addClass('selected');
      $('button.admin').removeClass('selected');
      socket.emit('authenticate', 'false', 'user');
    }); //button.user click

    //FILTER CODE (This is an in-house filter function! Will only work on our server.)
    $('#inputfilter').on('input', function() {
      var RE = new RegExp($(this).val(), 'i');

      $('#data tr:gt(0)').hide();
      $('#data tr').filter(RE).show();
      $('#data td').removeClass('highlight');
      if ($(this).val()) {
        $('#data td').filter(RE).addClass('highlight');
      }
    }); //#inputfilter click

    $(document).on('focus', 'td', function() {
      position = [$(this).index(), $(this).parent().index()];
    }); //document focus td

    $('#query').keydown(function(e) {
      if (e.which === 13) { //enter
        createTable();
      }
    }); //query keydown

    $(document).keydown(function(e) {
      var delta,
          offset = $('#query').val().split('offset ')[1];

      if(!$('td:focus').length) {
        return;
      }

      if(e.key === 'Home') {
        if(e.ctrlKey) {
          goto(position[0], 1);
          changeOffset(0);
        } else {
          goto(1, position[1]);
        }
      } else if(e.key === 'End') {
        if(e.ctrlKey) {
          goto(position[0], pageHeight);
          changeOffset(recordCount - pageHeight);
        } else {
          goto(-1, position[1]);
        }
      } else if(e.key === 'f' && e.ctrlKey) {
        find = prompt('Locate Value');
        if(find) {
          $('th i').remove();
          search($('th').eq(position[0]).text(), find);
        }
        return false;
      } else if (e.which === 34) { //PGDN
        if(+offset === recordCount - pageHeight) {
          goto(position[0], pageHeight);
        } else {
          delta = pageHeight;
        }
      } else if (e.which === 33) { //PGUP
        if(+offset === 0) {
          goto(position[0], 1);
        } else {
          delta = -pageHeight;
        }
      } else if (e.which === 40) { //down
        if(e.ctrlKey || $('td:focus').parent().index() == pageHeight) {
          delta = 1;
        } else {
          goto(position[0], position[1] + 1);
        }
      } else if (e.which === 38) { //up
        if((e.ctrlKey && offset !== '0') || $('td:focus').parent().index() == 1) {
          delta = -1;
        } else {
          goto(position[0], position[1] - 1);
        }
      } else if(e.which === 37) { //left
        goto(Math.max(0, position[0] - 1), position[1]);
        return false;
      } else if(e.which === 39) { //right
        goto(position[0] + 1, position[1]);
        return false;
      }

      if (delta) {
        $('#query').val(function(_, val) {
          var sp = val.split('offset '),
              ofs = Math.min(recordCount - pageHeight, Math.max(0, +sp[1] + delta));

          return sp[0] + 'offset ' + ofs;
        });

        createTable();
      }
    }); //document keydown

    $('button#excel').click(function() {
      var url = 'data:application/vnd.ms-excel,' + encodeURIComponent($('#data').html())
      location.href = url
      return false
    });

    $(document).on('click', '.exit', function(event) {
      event.stopPropagation();
      DEBUG_MODE ? console.log($(this).data('IP')):'';
      socket.emit('adminBoot', $(this).data('IP'));
    });

    $('#data').scroll(function() {
      var top = $('#data').scrollTop(),
        left = $('#data').scrollLeft();
      $('tr:nth-child(1) th').css('top', top - 1);
      $('th:nth-child(1), td:nth-child(1)').css('left', left - 1);
    });

    $('button.main').click(function(event) {
      //WORKING ON SQL VALIDATOR
      var tableName = $('#query').val() + ' ',
          matches = /from (.*?) /g.exec(tableName),
          value,
          name;

      if (matches!=null && matches.length > 1) {
        name = matches[1];
        $('button.tables').each(function() {
          $(this).css('background-color', '');
          $(this).removeClass('selected');
          if ($(this).text() === name) {
            $(this).addClass('selected');
            $('button.btn.btn-default').removeClass('disabled');
            $('button.btn.btn-default').prop('disabled', false);
            $('#inputfilter').prop('disabled', false);
          }
        });
      } else {
        console.error('There is an error in your SQL statement');
      }
    }); //button.main click
  } //events
//________________________________________________________________________________________________________________________
  function numeric(field) {
    return !(/varchar/.test(dataType[field]));
  } //numeric
//________________________________________________________________________________________________________________________
  function search(field, find) {
    var sql = $('#query').val(),
        table = /^select/i.test(sql) && sql.match(/(.+ from .+?)( |$)/i)[1],
        q = sql.split(/( where .+)?limit /i),
        sq;

    if(numeric(field)) {
      find = +find || 0;
    } else {
      find = '"' + find + '"';
    }

    sq = 'select count(*) as RECORDS, "' + field + '" as FIELD, "' + table + '" as `TABLE` from (' +
            table +
            ' where `' + field + '` < ' + find + ' or `' + field + '` is null' +
          ') as ALIAS';

DEBUG_MODE ? console.log(sq):'';
    socket.emit('query', sq, 'info');
  } //search
//________________________________________________________________________________________________________________________
  function goto(col, row) {
    var sl = $('#data').scrollLeft(),  //get the current scroll position
        $td = $(`tr:eq(${row}) td:eq(${col})`).focus();

    if($td.length) {
      $('#data').scrollLeft(sl);  //restore the original scroll position, because Chrome ain't too bright about this

      while(sl > 0 && $td.position().left < $('th:nth-child(1)').width() + 20) {
        $('#data').scrollLeft(sl-= 10);
      }

      while(sl < $('#data')[0].scrollWidth && $td.position().left + $td.width() > $('#data').width() - 20) {
        $('#data').scrollLeft(sl+= 10);
      }
    }
  } //goto
//________________________________________________________________________________________________________________________
  function createTable(sql) {
    var sql = (sql || $('#query').val()).trim(),
        format = $('button[title="Send Query"].selected').text().replace('json', 'JSON'),
        table = /^select/i.test(sql) && sql.match(/(.+ from .+?)( |$)/i)[1];

    timer = new Date();

    if(table && (table !== currentTable)) {
      socket.emit('query', `create temporary table temp (${sql})`);
      socket.emit('query', `describe temp`, 'info');
      socket.emit('query', `select count(*) as RECORDCOUNT from (${sql.replace(/ limit \d+ offset \d+/i, ' ')}) as TEMP`, 'info');
      socket.emit('query', `drop table temp`);
      currentTable = table;
    } else {
      $('button.editTable').html('<i class="material-icons" style="color:#757575;">edit</i>');
      socket.emit('query', sql, format);
    }
  } //createTable
//________________________________________________________________________________________________________________________
  function checkOrder(sql) {
    var sql = sql || $('#query').val(),
        desc = / desc /i.test(sql),
        order = sql.match(/ order +by +(.+?) /i),
        col;

    $('#data td').attr('tabindex', 1);

    $(`tr:eq(${position[1]}) td:eq(${position[0]})`).focus();

    $('#data th').each(function(idx) {
      var name = $(this).text();

      if(name !== 'Lab' && dataType[name] === 'double') {
        $(`#data td:nth-child(${idx + 1})`).text(function(_, txt) {
          return txt ? (+txt).toFixed(4) : '';
        });
      }
    });

    if(order) {
      if(+order[1]) {
        col = order[1] - 1;
      } else {
        col = $('th').filter(new RegExp('^' + order[1].replace(/`/g, '') + '$', 'i')).index();
      }

      if(find) {
        $(`#data tr:last td:nth-child(${col + 1})`).focus();

        $(`td:nth-child(${col + 1})`).each(function() {
          if(numeric($(`th:nth-child(${col + 1})`).text())) {
            if(+$(this).text() >= +find) {
              $(this).focus();
              return false;
            }
          } else {
            if($(this).text().toUpperCase() >= find.toUpperCase()) {
              $(this).focus();
              return false;
            }
          }
        });
        find = '';
      }

      if(desc) {
        $('th').eq(col).append('<i class="material-icons down" style="font-size:18px;">keyboard_arrow_down</i>');
      } else {
        $('th').eq(col).append('<i class="material-icons up"   style="font-size:18px;">keyboard_arrow_up</i>');
      }
    }
  } //checkOrder
//________________________________________________________________________________________________________________________
  function order(n) {
    var q = ' ' + $('#query').val() + ' ',
        flds    = q.match(/ select (.+?) from /i),
        table   = q.match(/ from (.+?) /i),
        limit   = q.match(/ limit (.+?) /i),
        offset  = q.match(/ offset (.+?) /i),
        asc = $('th').eq(n - 1).find('i.up').length,
        s = `select ${flds[1]} from ${table[1]} order by ${n}` + (asc ? ' desc' : '');

    if(limit)  s += ` limit ${limit[1]}`;
    if(offset) s += ` offset 0`;

    position = [position[0], 1];

    $('#query').val(s);

    createTable();
  } //order
//________________________________________________________________________________________________________________________
  function changeOffset(n) {
    var sql = $('#query').val().replace(/ offset \d+/, ' offset ' + n);
    timer = new Date();
    $('#query').val(sql);

    socket.emit('query', sql);
  } //changeOoffset
//________________________________________________________________________________________________________________________
  var socket = io.connect('http://aesl.ces.uga.edu:8080/', {  // Connect to our node/websockets server
        reconnection: false
      }),
      primaryKey,
      timer,
      pageHeight = 22,
      recordCount,
      changes = [],
      dataType = {},
      currentTable,
      find,
      position = [0, 1];

  console.log($('#data').height());
  setTimeout(function() {
    pageHeight = Math.round($('#data').height() / 31.2);
    console.log($('#data').height());
    socketEvents();
    events();

    socket.emit('load');
  });
});
