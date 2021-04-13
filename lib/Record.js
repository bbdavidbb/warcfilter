class Record {
    constructor(header, content) {
        this.header = header;
        this.content = content;
    }

    getHeader = () => {
        return this.header;
    }

    

    getContent = () => {
        return this.content;
    }
}

module.exports = Record;