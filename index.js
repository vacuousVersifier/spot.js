import Config from "./config.js";

import fsp from "fs/promises";
import path from "path";
import Librespot from "librespot";
import ffmpeg from "fluent-ffmpeg";

export default class App {
    constructor(options) {
        this.config = new Config(options);
    }

    login() {
        return new Promise((resolve, reject) => {
            this.spotify = new Librespot();

            this.spotify.login(
                this.config.getUsername(),
                this.config.getPassword()
            ).then(() => {
                resolve();
            }).catch(() => {
                reject(new Error("Could not log into Spotify!"));
            });
        });
    }

    downloadAlbum(albumID) {
        return new Promise((resolve, reject) => {
            let response = {
                totalTracks: 0,
                items: new Array()
            };
            let album;

            this.getAlbumMetadata(albumID).then(retrievedAlbum => {
                album = retrievedAlbum;
                return this.getAlbumTracks(albumID);
            }).then(async tracks => {
                response.totalTracks = tracks.length;

                for(let i = 0; i < tracks.length; i++) {
                    await this.downloadTrack(tracks[i], album.name).then(result => {
                        response.items.push({ 
                            track: tracks[i], 
                            result: "success",
                            value: result
                         });
                    }).catch(err => {
                        response.items.push({ 
                            track: tracks[i], 
                            result: "error",
                            value: err
                         });
                    })
                }
            }).then(() => {
                resolve(response);
            }).catch(err => {
                reject(err);
            });
        });
    }

    downloadTrack(track, albumName) {
        return new Promise((resolve, reject) => {
            let trackArtist = track.artists[0].name;
            let trackName = track.name;
            let trackNumber = track.trackNumber;
            let trackID = track.id;

            let outputName = this.config.getOutputTemplate();
            outputName = outputName.replace("{artist}", trackArtist);
            outputName = outputName.replace("{album}", albumName);
            outputName = outputName.replace("{track_number}", trackNumber);
            outputName = outputName.replace("{track}", trackName);
            outputName = outputName.replace("{ext}", "ogg");

            let filePath = `${this.config.getOutputRoot()}/${outputName}`;
            let parentPath = path.dirname(filePath);

            let tempPath = `${this.config.getOutputRoot()}/${outputName}.tmp`;

            // Checking if directory is already created
            fsp.mkdir(parentPath, { recursive: true }).then(() => {
                return this.checkFileExists(filePath);
            }).then(exists => {
                if(exists) reject(new Error("Track file already exists!"));

                return this.spotify.get.track(trackID);
            }).then(result => {
                return fsp.writeFile(tempPath, result.stream);
            }).then(() => {
                return this.convert(tempPath, filePath, track, albumName)
            }).then(() => {
                return fsp.unlink(tempPath);
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            })
        });
    }

    convert(tempPath, filePath, track, albumName) {
        return new Promise((resolve, reject) => {
            let trackArtist = track.artists[0].name;
            let trackName = track.name;
            let trackNumber = track.track_number;

            ffmpeg(tempPath)
            .audioCodec("copy")
            .outputOption(
                '-metadata', `artist=${trackArtist}`,
                '-metadata', `title=${trackName}`,
                '-metadata', `album=${albumName}`,
                '-metadata', `track=${trackNumber}`,
            )
            .output(filePath)
            .on('end', () => { resolve() })
            .on("error", err => reject(new Error("Could not convert track file!")))
            .run();
        });
    }

    checkFileExists(filepath){
        return new Promise((resolve, reject) => {
            fsp.access(filepath, fsp.constants.F_OK).then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
      }

    getAlbumTracks(albumID) {
        return new Promise(async (resolve, reject) => {
            this.spotify.get.albumTracks(albumID).then(tracks => {
                resolve(tracks);
            }).catch(err => {
                reject("Could not get album tracks!");
            });
        });
    }

    getAlbumMetadata(albumID) {
        return new Promise((resolve, reject) => {
            this.spotify.get.albumMetadata(albumID).then(album => {
                resolve(album)
            }).catch(err => {
                reject(new Error("Could not get album metadata!"))
            })
        });
    }
};