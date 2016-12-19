$(document).ready(function() {
  $('button.json').click(function(event) {
    var data = {
      query: $('#query').val(),
      type : 'json'
    };

    $.ajax({
        type: 'POST',                       // define the type of HTTP verb we want to use (POST for our form)
        url: 'http://soiltest:3000/query',  // the url where we want to POST
        data: data,                         // our data object
        dataType: 'json'                    // what type of data do we expect back from the server
      })
      .done(function(data, _, out) {
        var s = '<table>',
            flds = Object.keys(data[0]);
        
        $('button.json').text('json: ' + out.responseText.length + ' bytes');

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
      .fail(function(data) {
        console.log('Failure: ' + data.responseText);
      });
  }); //button.json click

  $('button.text').click(function(event) {
    var data = {
      query: $('#query').val(),
      type : 'text'
    };

    $.ajax({
        type: 'POST',                       // define the type of HTTP verb we want to use (POST for our form)
        url: 'http://soiltest:3000/query',  // the url where we want to POST
        data: data                          // our data object
      })
      .done(function(data, _, out) {
        var rows = data.split('\n'),
            s = '<table>';

        $('button.text').text('text: ' + out.responseText.length + ' bytes');

        s += '<tr><th>' + rows[0].replace(/\|/g, '<th>');
        rows.shift();
        s += '<tr><td>' + rows.join('<tr><td>').replace(/\|/g, '<td>');
        $('#data').html(s);
      })
      .fail(function(data) {
        console.log('Failure: ' + data.responseText);
      });
  }); //button.text click

  $('button.table').click(function(event) {
    var data = {
      query: $('#query').val(),
      type : 'table'
    };

    $.ajax({
        type: 'POST',                       // define the type of HTTP verb we want to use (POST for our form)
        url: 'http://soiltest:3000/query',  // the url where we want to POST
        data: data                          // our data object
      })
      .done(function(data, _, out) {
        $('button.table').text('table: ' + out.responseText.length + ' bytes');

        $('#data').html(data);
      })
      .fail(function(data) {
        console.log('Failure: ' + data.responseText);
      });
  }); //button.table click

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
});
