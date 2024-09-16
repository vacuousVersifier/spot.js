const os = require("os");
const fsp = require("fs/promises");

class Config {
  constructor() {
    this.config = new Object();
    this.config.test1 = "Hello"
    this.config.test2 = [1, 2, "H", 0x0100010]
  }

  load() {
    this.rootPath = `${os.homedir()}/.spot.js`
    this.configFile = `${this.rootPath}/config.json`
    this.outputRootPath = `/mnt/storage/music`
    this.outputTemplate = `{artist}/{album}/{track_number} {track}.{ext}`

    fsp.readFile(this.configFile).then(data => {
      this.config = JSON.parse(data.toString());

      console.log(this.config);
    }).catch(err => {
      return fsp.mkdir(this.rootPath)
      .then(() => {
        return fsp.writeFile(this.configFile, JSON.stringify(this.config));
      }).then(() => {
        console.log("File created!");
      });
    })
  }
}

module.exports = Config;