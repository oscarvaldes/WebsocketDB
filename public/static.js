$(document).ready(function(){
    // Connect to our node/websockets server
    var socket = io.connect('http://localhost:8080');

    $('button.json').click(function(event) {
      // var data = {
      //   query: $('#query').val(),
      //   type : 'json'
      // };
      //console.log("SYCEEESSS!!");
      var sql=$('#query').val();
      socket.emit('query',sql);
      }); //button.json click
    // Initial set of notes, loop through and add to list
      socket.on('create table', function(data){
         console.log(data);
         data=JSON.parse(data);
        var s = '<table>',
    flds = Object.keys(data[0]);

//    $('button.json').text('json: ' + out.responseText.length + ' bytes');

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

    })

    //  }); //button.json click

    // New socket connected, display new count on page
    socket.on('users connected', function(data){
        $('#usersConnected').html('Users connected: ' + data)
      //  console.log("TESTINGGGG");
    })

})
