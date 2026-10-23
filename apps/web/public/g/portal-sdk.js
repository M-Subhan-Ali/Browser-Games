/*
 * NeonArcade Portal SDK — the only way a game talks to the portal.
 * Every call is a postMessage to the parent page, which validates it.
 *
 * Usage inside a game:
 *   await Portal.ready();
 *   const { id, nickname } = await Portal.getPlayer();
 *   await Portal.save({ level: 3 });
 *   const data = await Portal.load();
 *   const res = await Portal.submitScore(1200);
 *   const board = await Portal.getLeaderboard();
 */
(function () {
  var seq = 0;
  var pending = {};

  // Accept replies only from our parent window.
  window.addEventListener("message", function (e) {
    if (e.source !== window.parent) return;
    var msg = e.data;
    if (!msg || msg.__portalReply !== true) return;
    var resolver = pending[msg.id];
    if (resolver) {
      delete pending[msg.id];
      resolver(msg.result);
    }
  });

  function call(name, args) {
    return new Promise(function (resolve) {
      var id = ++seq;
      pending[id] = resolve;
      window.parent.postMessage(
        { __portal: true, id: id, call: name, args: args || [] },
        "*"
      );
    });
  }

  window.Portal = {
    // ready() resends until the parent acknowledges. The game can load and run
    // its first handshake before the parent's message listener is attached, so
    // a single post can be lost — retrying closes that race.
    ready: function () {
      return new Promise(function (resolve) {
        var id = ++seq;
        var done = false;
        pending[id] = function (res) {
          done = true;
          resolve(res);
        };
        (function send() {
          if (done) return;
          window.parent.postMessage(
            { __portal: true, id: id, call: "ready", args: [] },
            "*"
          );
          setTimeout(send, 150);
        })();
      });
    },
    getPlayer: function () {
      return call("getPlayer");
    },
    save: function (data) {
      return call("save", [data]);
    },
    load: function () {
      return call("load");
    },
    submitScore: function (score) {
      return call("submitScore", [score]);
    },
    getLeaderboard: function () {
      return call("getLeaderboard");
    },
    gameplayStart: function () {
      return call("gameplayStart");
    },
    gameplayStop: function () {
      return call("gameplayStop");
    },
  };
})();
