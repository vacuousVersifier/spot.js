const { Spot } = require("./index.js");

let spot = new Spot();
spot.login().then(() => {
    return "6aZaBCvtxTLaoekZLLGSpq"
}).then(album_id => {
    return spot.download_album(album_id)
}).then(data => {
    console.log("done")
});
