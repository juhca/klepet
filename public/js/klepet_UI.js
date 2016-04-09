function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = sporocilo.match(/([a-z\-_0-9\/\:\.]*\.(jpg|png|gif|jpeg|tiff|exif|bmp|raw|svg))/gi);
  if(jeSlika)
  {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/&lt;img/g, '<img').replace(/png\' \/&gt;/g, 'png\' />').replace(/gif\' \/&gt;/g, 'gif\' />').replace(/jpg\' \/&gt;/g, 'jpg\' />').replace(/&lt;iframe/g, '<iframe').replace(/&lt;\/iframe&gt;/g, '</iframe>').replace(/&gt;/g, '>');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  var video = sporocilo.match(/((http(s)?:\/\/)?)(www\.)?((youtube\.com\/))/gi);
  if(video)
  {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/&lt;img/g, '<img').replace(/png\' \/&gt;/g, 'png\' />').replace(/gif\' \/&gt;/g, 'gif\' />').replace(/jpg\' \/&gt;/g, 'jpg\' />').replace(/&lt;iframe/g, '<iframe').replace(/&lt;\/iframe&gt;/g, '</iframe>').replace(/&gt;/g, '>');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);    
  }
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/&lt;img/g, '<img').replace(/png\' \/&gt;/g, 'png\' />').replace(/gif\' \/&gt;/g, 'gif\' />').replace(/jpg\' \/&gt;/g, 'jpg\' />').replace(/&lt;iframe/g, '<iframe').replace(/&lt;\/iframe&gt;/g, '</iframe>').replace(/&gt;/g, '>');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
  
}

function poisciYT(sporocilo){
    // pridobim ID youtube filma
  var id = sporocilo.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
  if(id != null){
    id = id[1];
    sporocilo = sporocilo.replace(/((http(s)?:\/\/)?)(www\.)?((youtube\.com\/)|(youtu.be\/))[\S]+/gi,"<iframe width='200px' height='150px' style='margin-left:20px;' src='https://www.youtube.com/embed/" + id + "' allowfullscreen ></iframe>" );
    //alert(id);
  }
  return sporocilo;
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function dodajSliko(input)
{
  input = input.replace(/([a-z\-_0-9\/\:\.]*\.(jpg|png|gif|jpeg|tiff|exif|bmp|raw|svg))/gi,"<img src='$1' style='margin-left:20px;' width='200px' />" );
  return input;
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = poisciYT(sporocilo);
  sporocilo = dodajSliko(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
      // ko klikne na uporabnika v naše tekstovno polje vnese /zasebno + vzdevek
    $('#seznam-uporabnikov div').click(function(event) {
      var ime = $(event.target).text();
      if(ime != trenutniVzdevek) document.getElementById("poslji-sporocilo").value = "/zasebno "+"\""+ime+"\""+" ";
      else alert("Samemu sebi ne moraš poslati zasebno sporočilo.");
      $('#poslji-sporocilo').focus();
    });
    
  });

  socket.on('dregljaj', function() {
      $("#vsebina").jrumble({
      	x: 0,
      	y: 0,
      	rotation: 5
      });
      $("#vsebina").trigger('startRumble');
      setTimeout(function(){
        $("#vsebina").trigger('stopRumble');
      }, 1500);
  })


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}