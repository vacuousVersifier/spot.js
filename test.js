import Spot from "./index.js";
import fsp from "fs/promises";
import cliProgress from "cli-progress";
import colors from "ansi-colors";

let spot = new Spot();
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
