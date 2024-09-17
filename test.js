import dotenv from "dotenv";
import Spot from "./index.js";
import fsp from "fs/promises";
import cliProgress from "cli-progress";
import colors from "ansi-colors";

dotenv.config();

let spot = new Spot({
    outputRoot: `/mnt/storage/music`,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectURI: process.env.REDIRECT_URI,
    username: process.env.USERNAME,
    password: process.env.PASSWORD
});


spot.login().then(() => {
    return fsp.readFile("/home/ollie/coder/projects/spot.js/AlbumList.txt");
}).then(async data => {
    let progress = new cliProgress.SingleBar({
        format: 'Downloading Albums ||' + colors.cyan('{bar}') + '|| {percentage}% || {value}/{total} Albums || Current ID: {album}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    let list = data.toString();
    let albums = list.split("\n");

    progress.start(albums.length, 0);

    for(let i = 0; i < albums.length; i++) {
        progress.update(i + 1, {
            album: albums[i]
        });

        await spot.downloadAlbum(albums[i]);
    }

    progress.close();
});
