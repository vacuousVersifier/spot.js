const { Spot } = require("./index.js");

let spot = new Spot();
spot.login().then(() => {
    return "6aZaBCvtxTLaoekZLLGSpq"
}).then(albumID => {
    return spot.downloadAlbum(albumID)
}).then(data => {
    console.log("done")
});
