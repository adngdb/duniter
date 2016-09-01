"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, $timeout, $stateParams, $translate, BMA, UIUtils) => {

  let syncWS = BMA.webmin.ws();

  UIUtils.enableInputs();
  $scope.synchronizing = false;
  $scope.sync_failed = false;
  $scope.host = $stateParams.host || localStorage.getItem('sync_host') || '';
  $scope.port = parseInt($stateParams.port) || parseInt(localStorage.getItem('sync_port')) || 8999;
  $scope.to = parseInt($stateParams.to);
  $scope.wrong_host = false;
  $scope.remote_current = null;

  $scope.checkNode = () => co(function *() {
    $scope.checking = true;
    try {
      const current = yield BMA.webmin.server.testSync({
        host: $scope.host,
        port: $scope.port
      });
      const targetHost = [$scope.host, $scope.port].join(':');
      if (current) {
        $scope.remote_current = current;
        $scope.checked_host = targetHost;
      }
    } catch (e) {
    }
    $scope.checking = false;
    return $scope.checked_host ? true : false;
  });

  $scope.startSync = () => {
    $scope.down_percent = 0;
    $scope.apply_percent = 0;
    $scope.sync_failed = false;
    $scope.synchronizing = true;
    return co(function *() {
      let sp = $scope.checked_host.split(':');
      let translatedErr = yield $translate('err.sync.interrupted');
      syncWS.on(undefined, (data) => {
        if (data.type == 'sync') {
          $scope.down_percent = 100;
          $scope.apply_percent = 100;
          $scope.sync_failed = data.value;
          let errorMessage = data.msg && (data.msg.message || data.msg);
          errorMessage = translatedErr + ' « ' + errorMessage + ' »';
          BMA.webmin.server.republishNewSelfPeer()
            .then(() => console.log('Peer republished'));
          if (data.value === true) {
            $state.go('index');
          } else {
            $state.go('error', { err: errorMessage });
          }
        } else {
          let changed = true;
          if (data.type == 'download' && $scope.down_percent != data.value) {
            $scope.down_percent = data.value;
            changed = true;
          }
          if (data.type == 'applied' && $scope.apply_percent != data.value) {
            $scope.apply_percent = data.value;
            changed = true;
          }
          if (changed) {
            $scope.$apply();
          }
        }
      });
      yield BMA.webmin.server.autoConfNetwork();
      localStorage.setItem("sync_host", sp[0]);
      localStorage.setItem("sync_port", sp[1]);
      BMA.webmin.server.startSync({
        host: sp[0],
        port: sp[1],
        to: $scope.to,
        chunkLen: Math.max(500, Math.min(25, $scope.remote_current ? $scope.remote_current.number / 100 : 0))
      });
    });
  };

  // Autostart
  if ($scope.host && $scope.port && $stateParams.sync) {
    return co(function *() {
      let nodeOK = yield $scope.checkNode();
      if (nodeOK) {
        return $scope.startSync();
      }
    });
  }
};
