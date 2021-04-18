/** 
* Parses a WARC file and outputs the filtered records to destination path file
*/

let readline = require("readline");
let fs = require("fs"); 
let zlib = require('zlib');

class WatParser {
    constructor(origPath, destPath, args, data) {
        this.origPath = origPath;
        this.headerStart = "WARC/1.0"
        this.nodeCount = 0;
        this.pairCount = 0;
        this.records = [];
        this.args = args;
        this.destPath = destPath;
        this.destStream = fs.createWriteStream(destPath, {flags:'a'});
        this.argToHeader = {"date": "WARC-Date", "url": "WARC-Target-URI", "fileType": "Content-Type"};

        this.data = data;

        if(typeof this.args['pairLimit'] !== 'undefined') {
            this.pairLimit = parseInt(this.args['pairLimit']);
        }
        else {
            this.pairLimit = Number.MAX_VALUE;
        }

        this.currentOffset = 0;
    }

    /**
     * Testing memory function to get
     * the records.
     * @returns {array} records
     */
    getRecords = () => {
        return this.records;
    }

    /**
     * Gets the number of records written so far
     * @returns {int} num records
     */
    getPairCount = () => {
        return this.pairCount;
    }

    getNodeCount = () => {
        return this.nodeCount;
    }

    /**
     * Writes a url pair to destPath 
     * @param {*} header header of WARC record
     * @param {*} record content portion of WARC record
     */
    addPair = async (header, record) => {
            try {
                // parses for the uri
                let top = JSON.parse(record)
                let envelope = top['Envelope']
                let warcMeta = envelope['WARC-Header-Metadata']
                let uri = warcMeta['WARC-Target-URI']

                // parses for the metadata of links on a response html page
                let payloadMeta = envelope['Payload-Metadata']
                let httpResponse = payloadMeta['HTTP-Response-Metadata']
                let htmlMeta = httpResponse['HTML-Metadata']
                let links = htmlMeta['Links']


                // console.log("Original uri: " + uri + "\n");
                // console.log

                for(let i of links) { 
                    if(i['url'].includes("http")) {
                        let pair = uri + " " + i['url'] + "\n"
                        this.pairCount += 1;
                        this.writePair(pair)
                    }
                }
            }
            catch(err) {
                // catches any undefined errors
            }
    }

    /**
     * fs stream writes the graph pair line
     * @param {string} line 
     */
    writePair = async (line) => {
        this.destStream.write(line)
    }

    /**
     * Pads of date string of yyyymmddhhmmss format to complete form if incomplete
     * @param {*} dat the date string
     * @returns the padded date
     */
    padDate = (dat) => {
        let newDat = dat;
        // 14 is the num of chars in the YYYYMMDDHHMMSS format
        let numAdd = 14 - dat.length 
        newDat += "0".repeat(numAdd)
        return newDat;
    }

    /**
     * Converts date object to yyyymmddhhmmss format
     * @param {Date obj} date 
     * @returns yyyymmddhhmmss format object
     */
    convDateToSimple = (date) => {
        let d = new Date(date)
        let second = '' + (d.getSeconds());
        let minute = '' + (d.getMinutes());
        let hour = '' + (d.getHours() )
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        let year = d.getFullYear();
        
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        if (hour.length < 2) {
            hour = '0' + hour;
        }
        if (minute.length < 2) {
            minute = '0' + minute;
        }
        if (second.length < 2) {
            second = '0' + second;
        }
        return [year, month, day, hour, minute, second].join('');
    }

    /**
     * Checks if WARC record passes argument criteria
     * @param {*} header of WARC record
     * @param {*} record content of WARC record
     * @returns true if passes false otherwise
     */
    queryCriteria = (header, record) => {
        return;
    }

    /**
     * Reads and decompresses WARC file
     * @returns {readline obj} containing the streams
     */
     readFile = () => {
        return readline.createInterface({
            input: this.data.pipe(zlib.createGunzip()),
            crlfDelay: Infinity
        })
    }

    /**
     * Compresses file at destPath
     */
    compressFile = async () => {
        return new Promise( async (resolve, reject) => {
            let compressPath = this.destPath + ".gz"    
            let compressor = zlib.createGzip() 
            let reader = fs.createReadStream(this.destPath);
            let writer = fs.createWriteStream(compressPath);
            reader.pipe(compressor).pipe(writer);
            resolve(true)
       });
    }

    /**
     * Removes specified file at dest path if exists
     * @param {*} dest the path of the file
     * @returns {Promise} file is either deleted or does not exist
     */
         rmIfExists = async (dest) => {
            return new Promise( async (resolve, reject) => {
            fs.access(dest[0], fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if(err) {
                    // file does not exists
                    resolve(true);
                }
                else {
                    fs.unlink(dest[0],function(err){
                        // deletes the destination file before proceeding
                        resolve(true);
                   });  
                }
                    
            });
        });
        }
    
    /**
     * Parses WARC file and writes if passes argument criteria
     */
    asyncParse = async () => {
        const lineReader = this.readFile();

        let header = "";
        let record = "";
        let inHeader = false;
        let inRecord = false;
        let firstCase = true;

        for await(let line of lineReader) {
            // console.log("enter line")
            // console.log(line)

            // first case includes the very first header
            if(line.includes(this.headerStart) && firstCase) {
                inHeader = true;
                firstCase = false;
            }


            if(inHeader) {

                // end of header
                if(line.length===0) {
                    header += line + "\n";
                    inHeader = false;
                    inRecord = true;
                }
                else {
                    header += line + "\n";
                }
            }

            if(inRecord) {
                // end of record
                if(line.includes(this.headerStart)) {
                    // create new record empty strings
                    await this.addPair(header, record);
                    header = "";
                    record = "";

                    inRecord = false;
                    inHeader = true;
                    header += line + "\n";
                }
                else {
                    record += line + "\n";
                }
            }
              
            //n > 1000000 ||
            if (this.pairCount >= this.pairLimit) {
                this.destStream.end();
                let finished = "Finished writing " + this.pairCount +  " pairs from " + this.origPath  + " to " + this.destPath + "\n ";
                console.log(finished);
                return;
            }
        }


        /**
         * Last record in file
         */
        if(header !=="") {
            await this.addPair(header, record);
        }
        this.destStream.end();
        this.destStream.destroy();

        let finished = "Finished writing " + this.pairCount +  " pairs from " + this.origPath  + " to " + this.destPath + "\n";
        console.log(finished);
    }


}

module.exports = WatParser;