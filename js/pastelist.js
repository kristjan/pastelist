PasteList = (function() {
  var ADJECTIVES, NOUNS;
  $.getJSON('data/adjectives.json', function(r) { ADJECTIVES = r; });
  $.getJSON('data/nouns.json', function(r) { NOUNS = r; });

  var searchesPending;
  var searchResults;
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
    loading(true);
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

  function loading(flag) {
    var search = $('#search');
    if (flag) {
      search.attr('disabled', 'disabled');
      search.siblings('.throbber').css('opacity', 1);
    } else {
      search.siblings('.throbber').css('opacity', 0);
      search.removeAttr('disabled');
    }
  }

  function findSongs(songs) {
    searchesPending = 0;
    searchResults = [];

    $.each(songs, function(i, song) {
      findSong(song, i);
    });
  }

  function findSong(song, i) {
    searchesPending++;
    Spotify.core.search(song, {
      onSuccess : function(result) {
        storeResult(result.tracks, i)
        if(--searchesPending === 0) {
          populateList();
        }
      }
    });
  }

  function storeResult(tracks, i) {
    if (tracks.length === 0) { return; }
    searchResults.push([i, new Model.Track(tracks[0])]);
  }

  function populateList() {
    searchResults.sort(function(a, b) {
      return a[0] - b[0];
    });
    $.each(searchResults, function(i, result) {
      addTrack(result[1]);
    });
    loading(false);
  }

  function addTrack(track) {
    currentPlaylist.add(new Model.Track(track));
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
    $('#prompt').removeClass('hidden');
    $('#playlist-name').val(name).focus().select();
  }

  function hideNamePrompt(evt) {
    if (typeof(evt) !== 'undefined') { evt.preventDefault(); }
    $('#prompt').addClass('hidden');
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
