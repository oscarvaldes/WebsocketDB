$(function() {
  // Connect to our node/websockets server
  var socket = io.connect('http://aesl.ces.uga.edu:8080/');
  var statement,
    primaryKey,
    answer = 0,
    condition,
    changes = [];

  function createTableText(sql) {
    var sql = sql || $('#query').val();
    var format = 'text';
    // sql = $('#query').val();
    $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    socket.emit('query', sql, format);

    socket.on('create table text', function(data) {

        var rows = data.split('\n'),
          s = '<table>';

        s += '<tr class="header"><th>' + rows[0].replace(/\|/g, '<th>');
        rows.shift();
        s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
        $('#data').html(s);

      }) //create table text
  }

  function createTableJSON(sql) {
    var sql = sql || $('#query').val();
    var format = 'JSON';
    // sql = $('#query').val();
    $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    socket.emit('query', sql, format);

    socket.on('create table JSON', function(data) {
        data = JSON.parse(data);
        var s = '<table>',
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

      }) //create table JSON

  }

  function createTableTable(sql) {
    var sql = sql || $('#query').val();
    var format = 'table';
    // sql = $('#query').val();
    $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    socket.emit('query', sql, format);

    socket.on('create table table', function(data) {
        $('#data').html(data);
      }) //create table table
  }

  $('#edit').hide();

  $('.btn-toggle').click(function() {
    $(this).find('.btn').toggleClass('active');

    if ($(this).find('.btn-primary').size() > 0) {
      $(this).find('.btn').toggleClass('btn-primary');
    }
    $(this).find('.btn').toggleClass('btn-default');

  });

  $('#success-alert').hide();
  $('#warning-alert').hide();
  $('#query').on('propertychange input', function(e) {
    if ($('#query').val() === '') {
      $('button.main.btn.btn-default').removeClass('selected');
      $('button.main.btn.btn-default').addClass('disabled');
      $('button.main.btn.btn-default').prop('disabled', true);
    } else {
      $('button.main.btn.btn-default').removeClass('disabled');
      $('button.main.btn.btn-default').prop('disabled', false);
    }
  });

  $(document).on('click', 'button.btn.btn-default.tables', function(event) {
    $('button.btn.btn-default').removeClass('disabled');
    $('button.btn.btn-default').prop('disabled', false);
    $('#inputfilter').prop('disabled', false);

  });

  $('button#displaydb').click(function(event) {

    $('button.tables.btn.btn-default').slideToggle("slow", function() {
      // Animation complete.
    });
  });

  socket.emit('load');
  socket.on('tables', function(rows) {
    $.each(rows, function(key, value) {
      $.each(value, function(key, value) {
        var button = $('<button class="tables btn btn-default">' + value + '</button>');
        $('#database').append(button);
      });
    });
  })
  $('button.main').click(function(event) {
    //WORKING ON SQL VALIDATOR
    // if($('#data').length){
    //   console.log('error');
    //   return;
    // }
var tableName = $('#query').val(),
    tableName= tableName+' ',
    matches = /from (.*?) /g.exec(tableName),
    value;
  if (matches.length > 1) {
    var name = matches[1];
    $( 'button.tables' ).each(function() {
      $(this).css('background-color', '');
      $(this).removeClass('selected');
      if($(this).text()===name){
        $(this).css('background-color','#bfb');
        $('button.btn.btn-default').removeClass('disabled');
        $('button.btn.btn-default').prop('disabled', false);
        $('#inputfilter').prop('disabled', false);
      }

    });
  } else {
    console.log('There is an error in your SQL statement');
  }
  }); //button.json click
  $('button.json').click(function(event) {
    createTableJSON();
  }); //button.json click

  $('button.text').click(function(event) {
    createTableText();
  }); //button.text click

  $('button.tableb').click(function(event) {
    createTableTable();
  }); //button.table click

  $(document).on('click', 'button.tables', function(event) {
    $( 'button.tables' ).each(function() {
    $(this).css('background-color','');
    $(this).removeClass('selected');
    })
    $('button.main.btn.btn-default').removeClass('disabled');
    $('button.main.btn.btn-default').prop('disabled', false);
    $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    var format = 'JSON',
      sql = 'select * from ' + $(this).text() + ' limit 200 offset 0',
      // sql = $('#query').val(),
      matches = /from (.*?) /g.exec(sql),
      res = sql.replace(matches[1], $(this).text());
    sql = res;
    $('#query').val(sql);

    createTableJSON();
  });

  //socket.emit('join', {email: user1@example.com}); THIS IS WHERE I AM

  // New socket connected, display new count on page
  socket.on('users connected', function(data) {
    var newstring,
      output,
      list,
      addresses = [];
    //  console.log(data)
    $('.dropdown-menu').empty();
    $.each(data, function(key, value) {

      if (value != null) {
        newstring = value.toString();
        output = newstring.replace(/::ffff:/g, '');
        addresses.push(output);
      }
    });
    // $('#usersConnected').html('Users Connected:' + addresses.length);
    $('#Users').html('<i class="material-icons"style="font-size:18px;">group</i>' + addresses.length);
    // $('.dropdown-menu').html('<p>'+addresses)
    // });
    $.each(addresses, function(i) {
      $('.dropdown-menu').append('<li>' + addresses[i]+' <i class="material-icons exit" style="font-size:18px;">close</i>' + '</li>');
      // $(this).data('IP', addresses[i]);
    });

    $('.exit').each(function(idx, li) {
      var IP=$(this).closest('li').text().slice(0,-6);
      $(this).data('IP', IP);
      // console.log(IP)
    // and the rest of your code
});
  //  console.log(addresses);
  })

  socket.on('clientdisconnect',function(data){
    socket.disconnect();
    console.log('DISCONNECT');
    $('#warning-alert').show();
  })

  // var counter=0;
  $(document).on('click', 'button', function(event) {

    if ($( 'button').hasClass( 'tables' )){
      // counter++;
      // console.log(counter);
    }
    else{
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
        //  $(this).removeAttr('sql');
        $(this).removeData('sql');
        $(this).removeAttr('style');
        $(this).removeClass('updated');

      });
      //console.log(changes.toString());
      socket.emit('update', changes);
      changes = [];
      statement = '';
      $('td').attr('contenteditable', 'false');
      $('td').removeClass('edit');
      $("#success-alert").alert();
      $("#success-alert").fadeTo(2000, 500).slideUp(500, function() {
        $("#success-alert").slideUp(500);
      });
      $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
    } else {
      $('td').attr('contenteditable', 'true');
      $('td').addClass('edit');
      //$('button.editTable').text('Save');
      $('button.editTable').html('<i class="material-icons"style="font-size:18px; color:#757575;">save</i>');

      $('.edit').click(function() {
        var format = 'text',
          tableName = $('#query').val(),
          matches = /from (.*?) /g.exec(tableName),
          value;
        if (matches.length > 1) {
          var name = matches[1];
        } else {
          console.log('There is an error in your SQL statement');
        }

        socket.emit('primary', name);
        socket.on('key', function(key) {
          primaryKey = key;
          $('.edit').on('input', function() {
            $(this).css('background-color', 'orange');
            $(this).addClass('updated');
            var th = $('#data th').eq($(this).index()); // returns text of respective header
            value = "'" + $(this).text() + "'";
            if (value === "''") {
              value = 'NULL';
            }
            var id = $(this).closest('tr').find('td:eq(1)').text();
            condition = id;
            statement = 'UPDATE ' + name + ' SET ' + th.text() + '=' + value + ' WHERE ' + primaryKey + '= ' + condition;
            //  $(this).attr('sql', statement);
            $(this).data('sql', statement);

          });

        })

      });
    } //tohere

  });

  $('.entireTable').click(function() {
    var format = 'text',
        tableName = $('#query').val(),
        matches = /from (.*?) /g.exec(tableName),
        value;
    if (matches.length > 1) {
      var name = matches[1];

    } else {
      console.log('There is an error in your SQL statement');
      // Not Found
    }
    if ($('button.editTable').text() === 'save') {
      bootbox.confirm("Warning continuing before saving will discard your changes, are you sure?", function(result) {
        if (result == false) {
          //do nothing
        } else {
          $('button.editTable').html('<i class="material-icons"style="color:#757575;">edit</i>');
          sql = 'select * from ' + name;
          createTableText(sql);

        }
      })
    } else {
      sql = 'select * from ' + name;
      createTableText(sql);
    }

  }); //end of entireTable

  $('button.admin').click(function(){
    function sendpassword(result){
      if(result){
      socket.emit('authenticate', result,'admin');
      socket.on('verified', function(message) {
        $('#edit').show();
        $('#Users').removeClass('disabled');
        $('#Users').removeAttr('disabled');
        $('button.user').removeClass('disabled');
        $('button.user').removeAttr('disabled');
        $('button.admin').addClass('disabled');
        $('button.admin').attr('disabled','true');
        $( '.bootbox' ).remove();
        $( '.modal-backdrop' ).remove();
          bootbox.alert(message, function() {
            $('body').removeClass('modal-open');
            $( '.bootbox' ).remove();
            $( '.modal-backdrop' ).remove();
          });
        })
        socket.on('exception', function(message) {
          if($('button.user').hasClass( 'active' )){
            //do nothing
          }
          else{
            $('button.user').click();
          }
          $( '.bootbox' ).remove();
          $( '.modal-backdrop' ).remove();
            bootbox.alert(message, function() {
              $('body').removeClass('modal-open');
              $( '.bootbox' ).remove();
              $( '.modal-backdrop' ).remove();
            });
          })
      }
      else{
         $('button.user').click();
      }
    }
    function sendinfo(callback){
      bootbox.prompt({
      title: "Authentification Required",
      inputType: 'password',
      callback: function (result) {

            if(callback){
              callback(result);
            }
          }
        });
    }

    sendinfo(sendpassword);

  }); //button.admin click

  $('button.user').click(function(event){
    $('#edit').hide();
    $('#Users').addClass('disabled');
    $('#Users').attr('disabled','true');
    $('button.admin').removeClass('disabled');
    $('button.admin').removeAttr('disabled');
    $('button.user').addClass('disabled');
    $('button.user').attr('disabled','true');
    socket.emit('authenticate','false','user');
  });
  //FILTER CODE
  $('#inputfilter').on('input', function() {
    var RE = new RegExp($(this).val(), 'i');

    $('#data tr:gt(0)').hide();
    $('#data tr').filter(RE).show();
    $('#data td').removeClass('highlight');
    if ($(this).val()) {
      $('#data td').filter(RE).addClass('highlight');
    }
    return;
    // if($('#data tr').filter(RE).show()){
    //   $('td').each(function() {
    //     if($(this).html().match(RE)){
    //     $(this).css('background-color','yellow');
    //   }
    //   else{
    //     $(this).removeAttr('style');
    //   }
    //   });
    // }
  });
  //   var iteration=0;
  //   $('#inputfilter').keyup(function(){
  //   filter = new RegExp($(this).val(),'i');
  //   $('#data tr').filter(function(){
  //     $(this).each(function(){
  //       found = false;
  //       $(this).children().each(function(){
  //         content = $(this).html();
  //         // if(content.match(filter))
  //         // {
  //           if(filter.toString()==='/(?:)/i'){
  //             $(this).removeAttr('style');
  //           }
  //           else if(content.match(filter)){
  //           found = true
  //           $(this).css('background-color','yellow');
  //           // console.log($(this).text());
  //         }
  //       //  }
  //         else{
  //           $(this).removeAttr('style');
  //         }
  //       });
  //       if(!found)
  //       {
  //         if($(this).children().prop('tagName')==='TH'){
  //           //do nothing
  //         }
  //         else if(filter.toString()==='/(?:)/i'){
  //           $(this).show();
  //         }
  //         else{
  //         $(this).hide();
  //       }
  //       }
  //       else
  //       {
  //         $(this).show();
  //       }
  //     });
  //   });
  // });
  //END OF FILTER

  $(document).keydown(function(e) {
    var delta;

    if (e.which === 34) { //PGDN
      delta = 30;
    } else if (e.which === 33) { //PGUP
      delta = -30;
    } else if (e.which === 40) { //down
      delta = 5;
    } else if (e.which === 38) { //up
      delta = -5;
    } else if (e.which === 13) { //up
      if($('body').hasClass('modal-open')){

      }
      else{
      $('button.main.json').click();
    }
    }

    if (delta) {
      $('#query').val(function(_, val) {
        var sp = val.split('offset '),
          ofs = +sp[1] + delta;

        return sp[0] + 'offset ' + ofs;
      });
      //create case for edit button
      if ($('button.tables').hasClass('selected')) {
        createTableText();
      } else if ($('button.main').hasClass('selected')) {
        createTableText();
      } else {
        createTableText();

      }

    }

  });

  $('button#excel').click(function() {
    var url = 'data:application/vnd.ms-excel,' + encodeURIComponent($('#data').html())
    location.href = url
    return false
  });

  // $('.dropdown-menu .material-icons .exit').click(function(event) {
  //   console.log('clicked')
  // });

$(document).on('click', '.exit', function(event) {
  event.stopPropagation();
  console.log($(this).data('IP'));
  socket.emit('adminBoot',$(this).data('IP'));
});

  $('#data').scroll(function() {
    var top  = $('#data').scrollTop(),
        left = $('#data').scrollLeft();

    $('tr:nth-child(1) th').css('top', top - 1);
    $('th:nth-child(1), td:nth-child(1)').css('left', left - 1);
  });

});
