/** 
* Parses a WARC file and outputs the filtered records to destination path file
*/

let readline = require("readline");
let fs = require("fs"); 
let zlib = require('zlib');

class WarcParser {
    constructor(origPath, destPath, args) {
        this.origPath = origPath;
        this.headerStart = "WARC/1.0"
        this.recordCount = 0;
        this.records = [];
        this.args = args;
        this.destPath = destPath;
        this.destStream = fs.createWriteStream(destPath, {flags:'a'});
        this.argToHeader = {"date": "WARC-Date", "url": "WARC-Target-URI", "fileType": "Content-Type"};
        if(typeof this.args['recordLimit'] !== 'undefined') {
            this.recordLimit = parseInt(this.args['recordLimit']);
        }
        else {
            this.recordLimit = Number.MAX_VALUE;
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
    getRecordCount = () => {
        return this.recordCount;
    }

    /**
     * Writes record to destPath if it passes the argument criteria
     * @param {*} header header of WARC record
     * @param {*} record content portion of WARC record
     */
    addRecord = async (header, record) => {
        if(this.queryCriteria(header, record)) {
            let combined = header + record;
            this.recordCount += 1;
            await this.writeRecord(combined);
        }
    }

    /**
     * fs stream writing the WARC record
     * @param {string} record 
     */
    writeRecord = async (record) => {
        this.destStream.write(record)
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
        let urlField = this.argToHeader["url"];
        let fileField = this.argToHeader["fileType"];
        let dateField = this.argToHeader["date"];

        let date = this.args["date"];
        let url = this.args["url"];
        let fileType = this.args['fileType'];

        let dateExist = typeof date !== 'undefined' ;
        let urlExist  = typeof url !== 'undefined';
        let fileTypeExist  = typeof fileType !== 'undefined';

        let a = dateExist ? "0" : "1";
        let b = urlExist ? "0" : "1";
        let c = fileTypeExist ? "0" : "1";


        let checks = [a, b, c];

        if(dateExist || urlExist) {
            let h = header.split(/\r?\n/)
            let hLen = h.length;

            for(let i = 0; i < hLen; i++) {
                let nextLine = h[i]

                if(nextLine.includes(dateField) && dateExist) {

                    if(date.length > 1) {
                        let arr = nextLine.split(" ");
                        let tStamp = arr[1]
                        let simpleDate = this.convDateToSimple(tStamp);

                        let date1 = this.padDate(date[0]);
                        let date2 = this.padDate(date[1]);

                        let greater = simpleDate >= date1;
                        let lesser = simpleDate <= date2;
                        let range = greater && lesser;
                        if(range) {checks[0] = "1"}
                    }
                    else {
                        for (let next of date) {
                            let arr = nextLine.split(" ");
                            let tStamp = arr[1]
                            let simpleDate = this.convDateToSimple(tStamp);
                            if(simpleDate.includes(next)) {
                                checks[0] = "1"
                            }
                        }
                    }
                }
                else if(nextLine.includes(urlField) && urlExist) {
                    for (let next of url) {
                        if(nextLine.includes(next)) {
                            checks[1] = "1"
                        }
                    }
                }
                else {
                    continue;
                }
            }
        }

        if(fileTypeExist) {
            let n = record.split(/\r?\n/)
            let nLen = n.length;
            if(nLen > 10) {nLen = 10}
            for(let i = 0; i < nLen; i++)
            {
                let next = n[i];
                if(next.includes(fileField)) {
                    let arr = next.split(" ");
                    let fType = arr[1]
                    for(let files of fileType) {
                        if(fType.includes(files)) {
                            //console.log("pog")
                            checks[2] = "1"
                            break;
                        }
                    }
                }
            }
        }

        if(checks.includes("0")) {
            return false;
        }
        else {
            return true;
        }

    }

    /**
     * Reads and decompresses WARC file
     * @returns {readline obj} containing the streams
     */
     readFile = () => {
        let stream = fs.createReadStream(this.origPath).pipe(zlib.createGunzip())
    
        return readline.createInterface({
            input: stream,
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
 
        let n = 0;
        let header = "";
        let record = "";
        let inHeader = false;
        let inRecord = false;
        let firstCase = true;

        for await(let line of lineReader) {
            n += 1

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
                    await this.addRecord(header, record);
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
            if (this.recordCount >= this.recordLimit) {
                this.destStream.end();
                let finished = "Finished writing " + this.recordCount +  " records from " + this.origPath  + " to " + this.destPath;
                console.log(finished);
                //lineReader.removeAllListeners()
                return;
            }
        }

        /**
         * Last record in file
         */
        if(header !=="") {
            await this.addRecord(header, record);
        }
        this.destStream.end();

        if(this.args["compressed"] === "true") {
            let response = await this.compressFile();
            if(response) {
                console.log("entered the response stage")
                await this.rmIfExists(this.destPath);
            }
        }

        let finished = "Finished writing " + this.recordCount +  " records from " + this.origPath  + " to " + this.destPath;
        console.log(finished);
    }


}

module.exports = WarcParser;