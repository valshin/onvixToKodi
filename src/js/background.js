chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const kodiIP = '192.168.1.11';
    const kodiPort = '8001';
    const kodiUrl = `http://${kodiIP}:${kodiPort}/jsonrpc`;

    async function clear(id) {
      return new Promise(function (resolve) {
        $.post({
          url: kodiUrl,
          data: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "Playlist.Clear",
            "params": {"playlistid": id},
            "id": 1
          }),
          success: res => resolve(res),
          contentType: "application/json",
          dataType: 'json'
        })
      })
    }

    async function add(playListUrl) {
      return new Promise(resolve => $.post({
        url: `http://${kodiIP}:${kodiPort}/jsonrpc`,
        data: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "Playlist.Add",
          "params": {
            "playlistid": 1,
            "item": {"file": playListUrl}
          },
          "id": 1
        }),
        success: res => resolve(res),
        contentType: "application/json",
        dataType: 'json'
      }));
    }

    async function play() {
      return new Promise(resolve => $.post({
        url: `http://${kodiIP}:${kodiPort}/jsonrpc`,
        data: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "Player.Open",
          "params": {"item": {"playlistid": 1, "position": 0}},
          "id": 1
        }),
        success: res => resolve(res),
        contentType: "application/json",
        dataType: 'json'
      }));
    }


    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");
    console.log(request.playListUrl);
    const kodiRequest =
      Promise
        .all([clear(1), clear(2)])
        .then(res => add(request.playListUrl))
        .then(res => play());
    sendResponse({msg: "message received", kodiRequest});
  });