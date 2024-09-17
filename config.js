import os from "os";

class Config {
    constructor(options) {
        this.configRoot = (options?.configRoot !== undefined) ? options.configRoot : `${os.homedir()}/.spot.js`
        this.configFile = `${this.configRoot}/config.json`
        this.outputRoot = (options?.outputRoot !== undefined) ? options.outputRoot : `${os.homedir()}/Music`
        this.outputTemplate = (options?.outputTemplate !== undefined) ? options.outputTemplate : `{artist}/{album}/{track_number} - {track}.{ext}`
        this.tempFilePath = `${this.configFile}/temp`

        if(options?.username !== undefined) {
            this.username = options.username
        } else {
            throw new Error("You must provide a Username!");
        }

        if(options?.password !== undefined) {
            this.password = options.password
        } else {
            throw new Error("You must provide a password!");
        }
    }

    getUsername() {
        return this.username
    }

    getPassword() {
        return this.password
    }

    getClientOptions() {
        return {
            clientId: this.clientID,
            clientSecret: this.clientSecret,
            redirectUri: this.redirectURI
        }
    }

    getTempFilePath() {
        return this.tempFilePath;
    }

    getOutputTemplate() {
        return this.outputTemplate;
    }

    getOutputRoot() {
        return this.outputRoot;
    }
}

export default Config;