/**
 * Parses a cdx file then passes a filtered index to a CDXToWarc file that writes 
 * the corresponding warc record to the destination
 */

let readline = require("readline");
let fs = require("fs"); 
let zlib = require('zlib');
let Record = require('./Record.js');
let {CDXLegend} = require('./CDXLegend.js')
let CDXToWarc = require('./CDXToWarc.js')

class CDXParser {
    constructor(origPath, destPath, args) {
        this.origPath = origPath;
        this.legend = {};
        this.args = args;
        this.indexes = [];
        this.header = [];
        this.CDXLegend = CDXLegend;
        this.destPath = destPath;

        this.readCompressed = false;
        if(this.origPath.includes(".gz")) {
            this.readCompressed = true;
        }


        if(typeof this.args['recordLimit']!== 'undefined') {
            this.recordLimit = parseInt(this.args['recordLimit']);
        }
        else {
            this.recordLimit = Number.MAX_VALUE;
        }
        this.legendToArg = {"date": "date **", "url": "original url **", "fileType": "mime type of original document *"};
        this.count = 0;
    }


    /**
     * Returns the indexes gathered from this cdx
     * @returns {array} containing string of indexes
     */
    getIndexes = () => {
        return this.indexes;
    }

    /**
     * Gathers the index if it passes the criteria
     * @param {string} line index line
     */
    addIndex = (line) => {
        let arr = line.split(" ");
        let len = arr.length;

        let indexObj = {};
        for(let i = 0; i < len; i++) {
            indexObj[this.header[i]] = arr[i];
        }

        if(this.queryCriteria(indexObj)){
            this.count +=1;
            this.indexes.push(indexObj);
        }
    }

    /**
     * Return number of indexes gathered so far
     * @returns {int}
     */
    getCount = () => {
        return this.count;
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
     * Decides whether to add an index based on the
     * argument criteria
     * @param {string} index 
     * @returns {boolean} true if passes false otherwise
     */
    queryCriteria = (index) => {
        for (let property in this.args){
            let criteria = this.args[property];
            let mappedLegend = this.legendToArg[property];

            let valueOfIndex = index[mappedLegend]
            let check = typeof mappedLegend === 'undefined' || typeof valueOfIndex === 'undefined'
            if(check) {
                continue;
            }
            //console.log(index);
            //console.log(property);

            if(property === 'date') {
                if(criteria.length > 1) {
                    let date1 = this.padDate(criteria[0]);
                    let date2 = this.padDate(criteria[1]);

                    //console.log(valueOfIndex);
                    let greater = valueOfIndex >= date1;
                    let lesser = valueOfIndex <= date2;
                    let range = greater && lesser;
                    //console.log(range);
                    if(!range) {return false;}
                    continue;

                }
                else {
                    let onlyDate = criteria[0]
                    if(!valueOfIndex.includes(onlyDate)) {
                        return false;
                    }
                }
            }
            else {
                let found = false;
                for(let next of criteria) {
                    if(valueOfIndex.includes(next)) {
                        //console.log(valueOfIndex);
                        found = true;
                    }
                }
                if(!found) {
                    return false;
                }
            }



            // if(!valueOfIndex.includes(criteria)) {
            //     return false;
            // }
        }
        return true;
    }

    /**
     * Extracts the header of this cdx
     * @param {array} header 
     */
    extractHeader = (header) => {
        let arr = header.split(" ")
        let order = arr.splice(2, arr.length);
        for(let next of order) {
            this.header.push(this.CDXLegend[next]);
        }
    }

    /**
     * Sets up the readstream of the cdx file
     * @returns {readline obj} iterable file
     */
    readFile = () => {
        let stream = fs.createReadStream(this.origPath)

        if(this.readCompressed) {
            let decompressStream = zlib.createGunzip().on('data', function (chunk) {
            }).on('error', function(err) {
                console.log("decompress stream of CDXParser: " + err);
            });
            stream.on('data', function (chunk) {
                decompressStream.write(chunk);
            }).on('error', function(err) {});
        }
        return readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        })
    }

    /**
     * Main parsing function of the cdx file
     */
    asyncParse = async () => {
        let lineReader = this.readFile();

        let n = 0;
        let firstCase = true;


        for await(let line of lineReader) {
            n += 1

            // first case includes the very first header
            if(firstCase) {
                firstCase = false;
                this.extractHeader(line);
                continue;
            }
            this.addIndex(line);

           
            if (this.count >= this.recordLimit ) {
                //lineReader.removeAllListeners()
                break;
            }
        }

        let answer = await this.asyncWrite();

        let finished = "Finished writing " + this.count +  " records from " + this.origPath  + " to " + this.destPath;
        if(answer) {
            console.log(finished);
        }
        else {
            console.log("Error in the promise from CDXToWarc file")
        }
    }

    /**
     * Turns over parsed files to CDXToWarc class to extract the warc records
     */
    asyncWrite = async () => {
        let writer = new CDXToWarc(this.indexes, this.origPath, this.destPath, this.args["compressed"]);
        console.log("entered the read/writing from warc stage");
        let finished = await writer.writeRecordFromIndex();
        return finished;
    }
 
}

module.exports = CDXParser;