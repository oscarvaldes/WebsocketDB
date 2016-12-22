$(document).ready(function(){
    // Connect to our node/websockets server
    var socket = io.connect('http://soiltest:8080');
    // var startTime;
    $('button.json').click(function(event) {
      var format='JSON';
      var sql=$('#query').val();
      startTime = Date.now();
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

    $(document).keydown(function(e) {
      var delta;

      if(e.which === 34) {         //PGDN
        delta = 30;
      } else if(e.which === 33) {  //PGUP
        delta = -30;
      } else if(e.which === 40) {  //down
        delta = 1;
      } else if(e.which === 38) {  //up
        delta = -1;
      }

      if(delta) {
        $('#query').val(function(_, val) {
          var sp = val.split('offset '),
              ofs = +sp[1] + delta;

          return sp[0] + 'offset ' + ofs;
        });
        $('button.selected').click();
      }
    });

    $('button').click(function() {
      $('button').removeClass('selected');
      $(this).addClass('selected');
    });

    $('button.edit').click(function(event) {
      $('td').attr('contenteditable','true');
      });

})
