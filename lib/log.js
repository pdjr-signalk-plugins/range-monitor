module.exports = class Log {

    constructor(fstat, ferr, prefix) {
        this.fstat = fstat;
        this.ferr = ferr;
        this.prefix = prefix;
    }

    N(message) { this.log(message); }
    W(message) { this.log(message); }
    E(message) { this.log(message, true); }

    log(message, error) {
        if (message !== undefined) {
	        if (this.prefix !== undefined) console.log("%s: %s", this.prefix, message);
            message = message.charAt(0).toUpperCase() + message.slice(1);
	        if ((error == undefined) || (!error)) { this.fstat(message); } else { this.ferr(message); }
        }
    }
}
