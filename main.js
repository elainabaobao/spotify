const PlaylistManager = {};

PlaylistManager.tracks = [];

PlaylistManager.currentSong = 0;

PlaylistManager.addTrack = (track = reqParam()) => {
    PlaylistManager.tracks.push(track);
}; 

PlaylistManager.removeById = (id) => {
    for (let i = 0; i < PlaylistManager.tracks.length; i++) {
        const track = PlaylistManager.tracks[i];
        if (track.id === id) {
            PlaylistManager.tracks.splice(i, 1);

            break;
        }
    }
}


PlaylistManager.getNextSong = () => {
    PlaylistManager.currentSong++;
    const {tracks, currentSong} = PlaylistManager;

    const len = tracks.length;
    if (currentSong === len) {
        PlaylistManager.currentSong = 0;
    }

    return tracks[PlaylistManager.currentSong].id;
}


const SpotifyAPI = {};

SpotifyAPI.urlBase = 'https://api.spotify.com';

SpotifyAPI.version = 1;

SpotifyAPI.getUrlBase = () => {
    const {urlBase, version} = SpotifyAPI;
    return urlBase + '/v' + version + '/';
    
}; 

SpotifyAPI.getUrlString = (endpoint) => {
    return SpotifyAPI.getUrlBase() + endpoint + '/?';
    
}; 

SpotifyAPI.search = (q = reqParam(), type = 'track') => {
    return new Promise((resolve, reject) => {
        const url = SpotifyAPI.getUrlString('search') + 'q=' + q + '&type=' + type;
        
        const http = new XMLHttpRequest();
        http.open('GET', url);

        http.onload = () => {
            const data = JSON.parse(http.responseText);
            resolve(data);
        };

        http.send();
    });
};

function reqParam() {
    throw new Error('This is a required param!');
}

(function() { 
    const validateSearch = (value) => {
        return new Promise((resolve, reject) => {
            if (value.trim() === "") {
                reject('Input a value');
            }

            resolve(value);
        });
    };

    const addTrackToHTML = (track) => {
        const {name, preview_url, id, album} = track;
        const imageUrl = album.images[1].url;

        const div = document.createElement('div');
        div.classList.add('ui', 'card', 'dimmable');
        div.innerHTML = getCardMarkup(name, preview_url, id, album, imageUrl, false);;
        results.appendChild(div);

        div.addEventListener('click',() => {
            PlaylistManager.addTrack(track);
            const currentIndex = PlaylistManager.tracks.length - 1;
            // console.log(currentIndex);

            const playlistTrack = document.createElement('div');
            playlistTrack.classList.add('ui', 'card', 'trackid-' + id);
            playlistTrack.innerHTML = `
<div class="item playlist-track trackid-${id}">
    <a href="#" class="playlist-close js-playlist-close">
        <i class="icon remove"></i>
    </a>
    <div class="ui tiny image">
      <img src="${imageUrl}">
    </div>
    <div class="middle aligned content playlist-content">
      ${name}
    </div>
</div>
        <audio controls style="width: 100%;">
            <source src="${preview_url}">
        </audio>
            `
            playlist.appendChild(playlistTrack)

            const audio = playlistTrack.querySelector('audio');

            audio.addEventListener('play', () => {
                PlaylistManager.currentSong = currentIndex;
            });

            audio.addEventListener('ended', () => {
                console.log('done!')
                const nextTrackId = PlaylistManager.getNextSong();

                setTimeout(() => {
                    document.querySelector(`.trackid-${nextTrackId} audio`).play();
                }, 1000);
                
            })

           const closeBtn = playlistTrack.querySelector('.js-playlist-close');
           closeBtn.addEventListener('click', () => {
                if (PlaylistManager.currentSong === currentIndex) {
                    const nextTrackId = PlaylistManager.getNextSong();

                    setTimeout(() => {
                        document.querySelector(`.trackid-${nextTrackId} audio`).play();
                    }, 500);
                }
                PlaylistManager.removeById(id);

                playlist.removeChild(playlistTrack);
           })
        })
    }

    const button = document.querySelector('.js-search');
    const input = document.querySelector('.js-input');
    const results = document.querySelector('.js-searchresult');
    const playlist = document.querySelector('.js-playlist');

    const getCardMarkup = (name, preview_url, id, album, imageUrl, isDimmed) => {
        let html = `
            <div class="image">
                <img src="${imageUrl}">
            </div>
            <div class="content">
                <a class="header">${name}</a>
                <div class="meta">${album.name}</div>
                <div class="description">
                    <audio controls class="${id}" style="width: 100%;">
                        <source src="${preview_url}">
                    </audio>
                </div>
            </div>
        `;
        if (isDimmed) {
            html += `<div class="ui dimmer transition visible active" style="display: block !important;"></div>`;
        }

        return html;
    }
    const runSearchQuery = () => {
        const {value} = input;

        validateSearch(value)
            .then((query) => {
                console.log('about to search for: ', query);

                input.value = '';
                input.setAttribute('disabled', 'disabled');
                button.setAttribute('disabled', 'disabled');


                return SpotifyAPI.search(query);
            })
            .then((data) => {
                
                input.removeAttribute('disabled');
                button.removeAttribute('disabled');
                results.innerHTML = "";
                const tracks = data.tracks.items;
                for(const track of tracks) {
                    addTrackToHTML(track);
                }

            })
            .catch((e) => {
                alert(e);
            });
    }

    button.addEventListener('click', (e) => runSearchQuery());

    input.addEventListener('keydown', (e) => {
        const {keyCode, which} = e;
        if (keyCode === 13 || which === 13) {
           runSearchQuery();
        }
    });
})();