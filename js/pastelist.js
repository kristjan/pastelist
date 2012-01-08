PasteList = (function() {
  var ADJECTIVES, NOUNS;
  $.getJSON('data/adjectives.json', function(r) { ADJECTIVES = r; });
  $.getJSON('data/nouns.json', function(r) { NOUNS = r; });

  var currentPlaylist;

  var Spotify = getSpotifyApi(1);
  var Model   = Spotify.require("sp://import/scripts/api/models");
  var View    = Spotify.require("sp://import/scripts/api/views");

  function init() {
    $('#search').click(search);
    $('#add-playlist').click(addPlaylist);
    $('#prompt').submit(createPlaylist);
    $('#cancel').click(hideNamePrompt);
  }

  function search() {
    $('#search').attr('disabled', 'disabled');
    lines = $('#pastebox').val().replace(/[-_]/g, ' ').split("\n");
    var songs = $.grep(lines, function(line, i) {
      return (line.match(/^\s*$/) === null);
    });
    currentPlaylist = new Model.Playlist();
    var list = new View.List(currentPlaylist);
    findSongs(songs);
    $('#results').children().remove();
    $('#results').append(list.node);
  }

  function findSongs(songs) {
    if (songs.length == 0) {
      $('#search').removeAttr('disabled');
      return;
    }

    var song = songs.shift();
    Spotify.core.search(song, {
      onSuccess : function(result) {
        addTrack(result.tracks);
        findSongs(songs);
      }
    });
  }

  function addTrack(tracks) {
    if (tracks.length == 0) { return; }
    currentPlaylist.add(new Model.Track(tracks[0]));
  }

  function addPlaylist() {
    if (currentPlaylist && currentPlaylist.length > 0) {
      var name = [randomWord(ADJECTIVES), randomWord(NOUNS)].join(' ');
      showNamePrompt(name);
    }
  }

  function randomWord(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function showNamePrompt(name) {
    $('#overlay').fadeIn(150);
    $('#playlist-name').val(name).focus().select();
  }

  function hideNamePrompt(evt) {
    if (typeof(evt) !== 'undefined') { evt.preventDefault(); }
    $('#overlay').fadeOut(150);
  }

  function createPlaylist(evt) {
    hideNamePrompt();
    var name = $('#playlist-name').val();
    var newPlaylist = new Model.Playlist(name);
    for (var i = 0; i < currentPlaylist.length; i++) {
      newPlaylist.add(currentPlaylist.get(i));
    };
  }

  return {
    init: init
  };
})();

$(PasteList.init);
