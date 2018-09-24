(function () {

  function findMovies() {
    const tokenRegex = new RegExp('movie\\/(.+)\\/play');

    async function processItem(movieItem) {
      if (movieItem.querySelector('.kodi-btn')) {
        return;
      }

      const buttonContainer = movieItem.querySelector('.movies-item--center');
      if (!buttonContainer) {
        return;
      }
      const kodiButton = document.createElement('a');
      kodiButton.innerHTML = '<strong>Play on KODI</strong>';
      kodiButton.className = "btn--default small btn-lg kodi-btn";
      buttonContainer.appendChild(kodiButton);

      kodiButton.addEventListener('click', () => onKodiBtnClick(movieItem));

      async function onKodiBtnClick(movieItem) {
        const movieLink = movieItem.querySelector('.btn-sm--azure').getAttribute('href');
        const movieJsonUrlTpl = 'https://onvix.tv/api/v1/movies/{TOKEN}.json';
        const movieStreamUrlTpl = 'https://onvix.tv/api/v1/streaming/movies/{TOKEN}/{STREAM_TOKEN}';

        async function loadMovieDescriptor(movieToken) {
          return fetch(movieJsonUrlTpl.replace('{TOKEN}', movieToken))
            .then(res => res.json());
        }

        async function getPlaylistDescriptor(movieToken, streamToken) {
          return fetch(movieStreamUrlTpl.replace('{TOKEN}', movieToken).replace('{STREAM_TOKEN}', streamToken))
            .then(res => res.json());
        }

        async function askForStream(streams) {
          return await showModal(streams)
        }

        async function sendToKodi(playListUrl) {
          chrome.runtime.sendMessage({playListUrl}, function(response) {
            console.log(response.msg);
          });
        }
        async function getBestQualityMp4(playListDescriptor) {
          const qualitiesUrl = playListDescriptor.media_files.mp4;
          return fetch(qualitiesUrl)
            .then(res => res.json())
            .then(tracks => {
              const maxQuality = Math.max(...(Object.keys(tracks).map(key => +key)));
              return tracks[maxQuality];
            });
        }

        const movieToken = movieLink.match(tokenRegex)[1];
        const movieDescriptor = await loadMovieDescriptor(movieToken);
        const streams = Object.values(movieDescriptor.movie.player_data.streams);
        const streamToken = await askForStream(streams);
        const playListDescriptor = await getPlaylistDescriptor(movieToken, streamToken);
        const track = await getBestQualityMp4(playListDescriptor);

        const kodiReq = await sendToKodi(track);
        console.log(track);
      }
    }

    const movieItems = [].slice.call(document.querySelectorAll('.onvix-slider-item'));
    movieItems.map(processItem)

  }

  async function showModal(streams) {
    const modal = document.getElementById('kodi-modal-dialog');
    const streamSelect = modal.querySelector('#kodi-modal-stream-select');
    streamSelect.innerHTML = streams.map(stream => {
      const value = stream.token;
      const viewValue = stream.translator;
      return `<option value="${value}">${viewValue}</option>`
    }).join();
    document.getElementById('kodi-modal-dialog').style.display = 'block';

    const submitButton = modal.querySelector('#kodi-modal-submit-button');
    return new Promise(resolve => {
      submitButton.onclick = () => {
        document.getElementById('kodi-modal-dialog').style.display = 'none';
        resolve(streamSelect.value)
      };
    });
  }

  function addModal(styles, modalHtml) {
    const styleNode = document.createElement('style');
    styleNode.type = 'text/css';
    styleNode.appendChild(document.createTextNode(styles));
    document.head.appendChild(styleNode);

    const modalNode = document.createElement('div');
    modalNode.id = 'kodi-modal-dialog';
    modalNode.className = 'kodi-modal';
    modalNode.innerHTML = modalHtml;
    modalNode.querySelector('#kodi-modal-modal-close-btn').addEventListener('click', () => modalNode.style.display = 'none');
    document.querySelector('html').appendChild(modalNode);
  }

  const modalHtml = `<!-- Modal content -->
  <div class="kodi-modal-content">
    <div class="modal-header">
    <span class="close" id="kodi-modal-modal-close-btn">&times;</span>
    <h2>Modal Header</h2>
  </div>
  <div class="modal-body">
    <select id="kodi-modal-stream-select"></select>
    <button id="kodi-modal-submit-button">Play</button>
  </div>
  <div class="modal-footer">
    <h3>Modal Footer</h3>
  </div>`;

  const styles = `/* The Modal (background) */
.kodi-modal {
    display: none; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.kodi-modal-content {
    background-color: #fefefe;
    margin: 15% auto; /* 15% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* Could be more or less, depending on screen size */
}

/* The Close Button */
.kodi-modal-close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.kodi-modal-close:hover,
.kodi-modal-close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}

/* Modal Header */
.kodi-modal-header {
    padding: 2px 16px;
    background-color: #5cb85c;
    color: white;
}

/* Modal Body */
.kodi-modal-body {padding: 2px 16px;}

/* Modal Footer */
.kodi-modal-footer {
    padding: 2px 16px;
    background-color: #5cb85c;
    color: white;
}

/* Modal Content */
.kodi-modal-content {
    position: relative;
    background-color: #fefefe;
    margin: auto;
    padding: 0;
    border: 1px solid #888;
    width: 80%;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
    animation-name: animatetop;
    animation-duration: 0.4s
}

/* Add Animation */
@keyframes animatetop {
    from {top: -300px; opacity: 0}
    to {top: 0; opacity: 1}
}`;
  addModal(styles, modalHtml);
  setInterval(() => findMovies(), 2000);
})();

