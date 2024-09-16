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

    downloadAlbum(albumID) {
        return this.getAlbumTracks(albumID).then(tracks => {
            let trackPromises = new Array();
            for(let i = 0; i < tracks.length; i++) {
                trackPromises.push(this.downloadTrack(tracks[i].id));
            }
            return Promise.allSettled(trackPromises);
        })
    }

    getAlbumTracks(albumID) {
        return new Promise(async (resolve, reject) => {
            let loop = true;
            let tracks = new Array();
            let offset = 0;

            while(loop) {
                await this.spotify.getAlbumTracks(albumID, { limit : 50, offset }).then(data => {
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

    downloadTrack(trackID) {
        return new Promise((resolve, reject) => {
            let outputTemplate = this.config.get_output_template



            resolve();
        })
    }

    getSongInfo(trackID) {

    }
}

module.exports = App;