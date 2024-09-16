const Config = require("./config");

const dotenv = require("dotenv");
const spotifyWebAPI = require("spotify-web-api-node");

class App {
    constructor() {
        this.config = new Config();

        dotenv.config();
    }

    login() {
        this.config.load();

        const options = {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: process.env.REDIRECT_URI
        }

        this.spotify = new spotifyWebAPI(options);

        return this.spotify.clientCredentialsGrant().then(data => {
            console.log("The spotify access token expires in " + data.body["expires_in"] + " seconds");
            console.log("The spotify access token is " + data.body["access_token"]);

            this.spotify.setAccessToken(data.body["access_token"]);
        });
    }

    download_album(album_id) {
        return this.get_album_tracks(album_id).then(tracks => {
            let track_promises = new Array();
            for(let i = 0; i < tracks.length; i++) {
                track_promises.push(this.download_track(tracks[i].id));
            }
            return Promise.allSettled(track_promises);
        })
    }

    get_album_tracks(album_id) {
        return new Promise(async (resolve, reject) => {
            let loop = true;
            let tracks = new Array();
            let offset = 0;

            while(loop) {
                await this.spotify.getAlbumTracks(album_id, { limit : 50, offset }).then(data => {
                    loop = data.body.next !== null;
                    offset += 50;

                    data.body.items.forEach(track => {
                        tracks.push(track);
                    });
                });
            }

            resolve(tracks);
        });
    }

    download_track(track_id) {
        return new Promise((resolve, reject) => {
            console.log(track_id);
            resolve();
        })
    }
}

module.exports = App;