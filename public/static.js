$(function() {
  // Connect to our node/websockets server
  var socket = io.connect('http://soiltest:8080'),
      statement,
      primaryKey,
      answer = 0,
      condition,
      changes = [];

    $(document).on('click', 'button.btn.btn-default', function(event) {
      $('button.btn.btn-default').removeClass('disabled');
      $('#inputfilter').prop('disabled', false);

    });

    $('button#displaydb').click(function(event){
    //  $('button.tables.btn.btn-default').toggle();
      $( 'button.tables.btn.btn-default').slideToggle( "slow", function() {
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
  $('button.json').click(function(event) {
    var format = 'JSON',
        sql = $('#query').val();
    $('button.editTable').text('edit table');
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

  }); //button.json click

  $('button.text').click(function(event) {
    var format = 'text',
        sql = $('#query').val();
    $('button.editTable').text('edit table');
    socket.emit('query', sql, format);

    socket.on('create table text', function(data) {

    var rows = data.split('\n'),
        s = '<table>';

      s += '<tr class="header"><th>' + rows[0].replace(/\|/g, '<th>');
      rows.shift();
      s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
      $('#data').html(s);

    }) //create table text
  }); //button.text click

  $('button.tableb').click(function(event) {
    var format = 'table',
        sql = $('#query').val();
    $('button.editTable').text('edit table');
    socket.emit('query', sql, format);

    socket.on('create table table', function(data) {
      $('#data').html(data);
    }) //create table table
  }); //button.table click

  $(document).on('click', 'button.tables', function(event) {
    $('button.editTable').text('edit table');
    var format = 'JSON',
    sql= 'select * from '+ $(this).text()+' limit 200 offset 0',
    // sql = $('#query').val(),
    matches = /from (.*?) /g.exec(sql),
    res = sql.replace(matches[1], $(this).text());
    sql = res;
    $('#query').val(sql);

    // $('button').removeClass('selected');
    // $(this).addClass('selected');
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

  });

  // New socket connected, display new count on page
  socket.on('users connected', function(data) {
    var newstring,
    output,
    list,
    addresses = [];
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
    $.each(addresses, function(i){
      $('.dropdown-menu').append('<li>'+addresses[i]+'</li>');

  });

  })

  $(document).on('click', 'button', function(event) {
    $('button').removeClass('selected');
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
      $('button.editTable').text('edit table');
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
    if($('button.editTable').text()==='save'){
      bootbox.confirm("Warning continuing before saving will discard your changes, are you sure?", function(result){
        if(result==false){
          //do nothing
        }
        else{
          $('button.editTable').text('edit table');
          sql = 'select * from ' + name;
          //console.log(sql);
          socket.emit('query', sql, format);
          socket.on('create table text', function(data) {

            var rows = data.split('\n'),
              s = '<table>';

            //  $('button.text').text('text: ' + out.responseText.length + ' bytes');

            s += '<tr><th>' + rows[0].replace(/\|/g, '<th>');
            rows.shift();
            s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
            $('#data').html(s);

          }) //create table text

        }
      })
    }
    else{
    sql = 'select * from ' + name;
    //console.log(sql);
    socket.emit('query', sql, format);
    socket.on('create table text', function(data) {

      var rows = data.split('\n'),
        s = '<table>';

      //  $('button.text').text('text: ' + out.responseText.length + ' bytes');

      s += '<tr class="header"><th>' + rows[0].replace(/\|/g, '<th>');
      rows.shift();
      s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
      $('#data').html(s);

    }) //create table text
  }

  });//end of entireTable

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
    }

    if (delta) {
      $('#query').val(function(_, val) {
        var sp = val.split('offset '),
          ofs = +sp[1] + delta;

        return sp[0] + 'offset ' + ofs;
      });
      //create case for edit button
      if ($('button.editTable').hasClass('selected')) {
        $('button.text').click();
      } else {
        $('button.selected').click();
      }
      //   if($('button.tables').hasClass('selected')){
      //     $('button.text').click();
      //   }
      //   else{
      //   $('button.selected').click();
      // }
    }

  });

  $('button#excel').click(function(){
    var url='data:application/vnd.ms-excel,' + encodeURIComponent($('#data').html())
    location.href=url
    return false
})

});
