importScripts("/avro.min.202102220019.js");
importScripts("/comlink.min.202301052101.js");

var CandidateSelection = {};

var avro = new AvroPhonetic(
  function () {
    return CandidateSelection;
  },
  function (cS) {
    CandidateSelection = cS;
  }
);

var comm = {
  getVersion: function () {
    return avro.version;
  },
  getSuggestion: function (subtext) {
    var res = subtext.match(/\s?([^\s]+)$/);
    if (res == null) return null;
    var bnregex = /[\u0980-\u09FF]+$/;
    if (bnregex.exec(res[1])) return null;
    var query = res[1];

    var bnarr = avro.suggest(query);

    bnarr.words = bnarr.words.slice(0, 10);
    if (avro.candidate(query) === query) {
      bnarr.prevSelection = bnarr.words.length;
    }
    bnarr.words.push(query);

    return bnarr;
  },
  setCommit: function (qtxt, value) {
    avro.commit(qtxt, value);
  }
}

Comlink.expose(comm);