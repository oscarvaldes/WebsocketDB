$(document).ready(function(){
    // Connect to our node/websockets server
    var socket = io.connect('http://localhost:8080');
    var statement;
    var primaryKey;
    var answer=0;
    var condition;
    var changes = [];

    function update(callback) {
      // var id = $(this).closest('tr').find('td:eq(1)').text();
      // console.log(id);


      callback();
}//end of update
    // var startTime;
    $('button.json').click(function(event) {
      $('button.editTable').text('edit table');
      var format='JSON';
      var sql=$('#query').val();
      //startTime = Date.now();
      socket.emit('query',sql,format);

      socket.on('create table JSON', function(data){
         //console.log(data);
        //  latency = Date.now() - startTime;
        //  console.log(latency);
         data=JSON.parse(data);
        var s = '<table>',
    flds = Object.keys(data[0]);

//   $('button.json').text('json: ' + out.responseText.length + ' bytes');

    s += '<tr>';
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

  })//create table JSON
}); //button.json click

$('button.text').click(function(event) {
  $('button.editTable').text('edit table');
  var format='text';
  var sql=$('#query').val();
  socket.emit('query',sql,format);

  socket.on('create table text', function(data){

    var rows = data.split('\n'),
        s = '<table>';

  //  $('button.text').text('text: ' + out.responseText.length + ' bytes');

    s += '<tr><th>' + rows[0].replace(/\|/g, '<th>');
    rows.shift();
    s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
    $('#data').html(s);

  })//create table text
}); //button.text click

  $('button.table').click(function(event) {
    $('button.editTable').text('edit table');
    var format='table';
    var sql=$('#query').val();
    socket.emit('query',sql,format);

    socket.on('create table table', function(data){
    //  $('button.table').text('table: ' + out.responseText.length + ' bytes');
      $('#data').html(data);
    })//create table table
  }); //button.table click

    // New socket connected, display new count on page
    socket.on('users connected', function(data){
        $('#usersConnected').html('Users connected: ' + data)
      //  console.log("TESTINGGGG");
    })

    $('button').click(function() {
      $('button').removeClass('selected');
      $(this).addClass('selected');
    });

    $('button.editTable').click(function(event) {

        //send update request
      if($('button.editTable').text()==='Done'){

        $('.updated').each(function(){
          changes.push($(this).attr('sql'));
          $(this).removeAttr('sql');
          $(this).removeAttr('style');
          $(this).removeClass('updated');

        });
        //console.log(changes.toString());
        socket.emit('update',changes);
        changes=[];
        statement='';
        $('td').attr('contenteditable','false');
        $( 'td' ).removeClass( 'edit' );
        $('button.editTable').text('edit table');
      }
      else{
        $('td').attr('contenteditable','true');
        $( 'td' ).addClass( 'edit' );
        $('button.editTable').text('Done');

        $('.edit').click(function(){
        update(function() {
          var format='text';
          var tableName=$('#query').val();
          var matches = /from (.*?) /g.exec(tableName);
          var value;
          if(matches.length > 1) {
            var name = matches[1];
            //  console.log($(this).text());  //do whatever you want with the text DONE
          }
          else {
            console.log('There is an error in your SQL statement');
            // Not Found
          }

          socket.emit('primary',name);
          socket.on('key', function(key){
            primaryKey=key;
            $('.edit').on('input', function() {
              $(this).css('background-color','orange');
              $(this).addClass('updated');
              var th = $('#data th').eq($(this).index());// returns text of respective header
              //console.log(th.text());
              value = "'"+$(this).text()+"'";
              if(value==="''"){
                value='NULL';
              }
              //console.log(value);
              var id = $(this).closest('tr').find('td:eq(1)').text();
              condition=id;
              statement='UPDATE '+name+' SET '+th.text()+'='+value+' WHERE '+primaryKey+'= '+condition;
              $(this).attr( 'sql',statement );

            });

          })

          });

        });
    }//tohere

      });

      $('.entireTable').click(function(){
        var format='text';
        var tableName=$('#query').val();
        var matches = /from (.*?) /g.exec(tableName);
        var value;
        if(matches.length > 1) {
          var name = matches[1];
          //  console.log($(this).text());  //do whatever you want with the text DONE
        }
        else {
          console.log('There is an error in your SQL statement');
          // Not Found
        }
        sql='select * from '+name;
        console.log(sql);
        socket.emit('query',sql,format);
        socket.on('create table text', function(data){

          var rows = data.split('\n'),
              s = '<table>';

        //  $('button.text').text('text: ' + out.responseText.length + ' bytes');

          s += '<tr><th>' + rows[0].replace(/\|/g, '<th>');
          rows.shift();
          s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
          $('#data').html(s);

        })//create table text

      });

      $(document).keydown(function(e) {
        var delta;

        if(e.which === 34) {         //PGDN
          delta = 30;
        } else if(e.which === 33) {  //PGUP
          delta = -30;
        } else if(e.which === 40) {  //down
          delta = 5;
        } else if(e.which === 38) {  //up
          delta = -5;
        }

        if(delta) {
          $('#query').val(function(_, val) {
            var sp = val.split('offset '),
                ofs = +sp[1] + delta;

            return sp[0] + 'offset ' + ofs;
          });
          //create case for edit button
          if($('button.editTable').hasClass('selected')){
            $('button.text').click();
          }
          else{
          $('button.selected').click();
        }
        }
      });

});
