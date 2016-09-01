
module.exports = function Peer(json) {

  var that = this;

  var BMA_REGEXP = /^BASIC_MERKLED_API( ([a-z_][a-z0-9-_.]*))?( ([0-9.]+))?( ([0-9a-f:]+))?( ([0-9]+))$/;

  Object.keys(json).forEach(function(key) {
    that[key] = json[key];
  });

  that.endpoints = that.endpoints || [];
  that.statusTS = that.statusTS || 0;

  that.keyID = function () {
    return that.pubkey && that.pubkey.length > 10 ? that.pubkey.substring(0, 10) : "Unknown";
  };

  that.copyValues = function(to) {
    var obj = that;
    ["version", "currency", "pub", "endpoints", "hash", "status", "statusTS", "block", "signature"].forEach(function (key) {
      to[key] = obj[key];
    });
  };

  that.copyValuesFrom = function(from) {
    var obj = that;
    ["version", "currency", "pub", "endpoints", "block", "signature"].forEach(function (key) {
      obj[key] = from[key];
    });
  };

  that.json = function() {
    var obj = that;
    var json = {};
    ["version", "currency", "endpoints", "status", "block", "signature"].forEach(function (key) {
      json[key] = obj[key];
    });
    json.raw = that.getRaw();
    json.pubkey = that.pubkey;
    return json;
  };

  that.getBMA = function() {
    var bma = null;
    that.endpoints.forEach(function(ep){
      var matches = !bma && ep.match(BMA_REGEXP);
      if (matches) {
        bma = {
          "dns": matches[2] || '',
          "ipv4": matches[4] || '',
          "ipv6": matches[6] || '',
          "port": matches[8] || 9101
        };
      }
    });
    return bma || {};
  };

  that.getDns = function() {
    var bma = that.getBMA();
    return bma.dns ? bma.dns : null;
  };

  that.getIPv4 = function() {
    var bma = that.getBMA();
    return bma.ipv4 ? bma.ipv4 : null;
  };

  that.getIPv6 = function() {
    var bma = that.getBMA();
    return bma.ipv6 ? bma.ipv6 : null;
  };

  that.getPort = function() {
    var bma = that.getBMA();
    return bma.port ? bma.port : null;
  };

  that.getHost = function() {
    var bma = that.getBMA();
    var host =
      (that.hasValid4(bma) ? bma.ipv4 :
        (bma.dns ? bma.dns :
          (bma.ipv6 ? '[' + bma.ipv6 + ']' : '')));
    return host;
  };

  that.getURL = function() {
    var bma = that.getBMA();
    var base =
      (that.hasValid4(bma) ? bma.ipv4 :
        (bma.dns ? bma.dns :
          (bma.ipv6 ? '[' + bma.ipv6 + ']' : '')));
    if(bma.port)
      base += ':' + bma.port;
    return base;
  };

  that.hasValid4 = function(bma) {
    return bma.ipv4 && !bma.ipv4.match(/^127.0/) && !bma.ipv4.match(/^192.168/) ? true : false;
  };

  that.getNamedURL = function() {
    var bma = that.getBMA();
    var base =
      (that.hasValid4(bma) ? bma.ipv4 :
        (bma.dns ? bma.dns :
          (bma.ipv6 ? '[' + bma.ipv6 + ']' : '')));
    if(bma.port)
      base += ':' + bma.port;
    return base;
  };

  that.isReachable = function () {
    return that.getURL() ? true : false;
  };
};
