import Config from "./config.js";

import fsp from "fs/promises";
import path from "path";
import spotifyWebAPI from "spotify-web-api-node";
import Librespot from "librespot";
import ffmpeg from "fluent-ffmpeg";

export default class App {
    constructor(options) {
        this.config = new Config(options);
    }

    login() {
        this.librespot = new Librespot();
        this.spotify = new spotifyWebAPI(this.config.getClientOptions());
        
        return this.librespot.login(this.config.getUsername(), this.config.getPassword()).then(() => {
            return this.spotify.clientCredentialsGrant()
        }).then(data => {
            console.log("The spotify access token expires in " + data.body["expires_in"] + " seconds");
            console.log("The spotify access token is " + data.body["access_token"]);

            this.spotify.setAccessToken(data.body["access_token"]);
        });
    }

    downloadAlbum(albumID) {
        return this.getAlbumTracks(albumID).then(tracks => {
            let trackPromises = new Array();
            for(let i = 0; i < tracks.length; i++) {
                trackPromises.push(this.downloadTrack(tracks[i], albumID));
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

    downloadTrack(track, albumID) {
        return new Promise(async (resolve, reject) => {
            let outputTemplate = this.config.getOutputTemplate();

            if(this.storedAlbums[albumID] === undefined) {
                await this.getAlbum(albumID);
            }


            let artist = track.artists[0].name;
            let albumName = this.storedAlbums[albumID].name;
            let name = track.name;
            let trackNumber = track.track_number;

            outputTemplate = outputTemplate.replace("{artist}", artist)
            outputTemplate = outputTemplate.replace("{album}", albumName)
            outputTemplate = outputTemplate.replace("{track_number}", trackNumber)
            outputTemplate = outputTemplate.replace("{track}", name)
            outputTemplate = outputTemplate.replace("{ext}", "ogg")

            let filePath = `${this.config.getOutputRoot()}/${outputTemplate}`
            let tempPath = `${this.config.getOutputRoot()}/${outputTemplate}.tmp`
            let parentPath = path.dirname(filePath)
            

            fsp.mkdir(parentPath, { recursive: true }).then(() => {
                return fsp.readFile(filePath)
                .catch(err => {
                    return this.librespot.get.track(track.id);
                }).then(result => {
                    return fsp.writeFile(tempPath, result.stream);
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        ffmpeg(tempPath)
                        .audioCodec("copy")
                        .outputOption(
                            '-metadata', `artist=${artist}`,
                            '-metadata', `title=${name}`,
                            '-metadata', `album=${albumName}`,
                            '-metadata', `track=${trackNumber}`,
                        )
                        .output(filePath)
                        .on('end', () => { resolve() })
                        .run();
                    });
                }).then(() => {
                    return fsp.unlink(tempPath);
                }).then(() => {
                    resolve();
                }).catch(err => {});
            })
        })
    }

    getAlbum(albumID) {
        return this.spotify.getAlbum(albumID).then(data => {
            this.storedAlbums[data.body.id] = data.body;
            return data.body;
        })
    }
};