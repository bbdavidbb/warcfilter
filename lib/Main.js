/**
 * Main driver program runs the arguments recieved from the CLI interface
 */
const WarcParser = require('./WarcParser.js')
const CDXParser = require('./CDXParser.js')
const CDXCreator = require('./CDXCreator.js')
let fs = require('graceful-fs');

// Reserved keywords
const src = "src"
const dest = "dest"
const mode = "mode"
const fileType = "fileType"
const url = "url"
const date = "date"
const recordLimit = "recordLimit"
const compressed = "compressed"
const fileLimit = "fileLimit"
const type = "type"

class Main {

    constructor() {
        this.flags = [src, dest, mode, fileType, date, url,recordLimit, fileLimit, type, compressed]
    }

    /**
     * Parses arguments and runs corresponding CLI Option
     * @param {string} input cli arguments
     */
    run = async (input) =>{

        // arguments right now are space delimited
        let arr = input.split(" ")
        let len = arr.length;


        if(len <= 1){
            return;
        }

        let obj = this.parseArgs(input)
        await this.rmIfExists(obj[dest])
    
        if(obj[mode] ==="warc") {
            console.log("running warc parser...")
            await this.runWarcParser(obj[src], obj[dest], obj)
        }
        else if(obj[mode] ==="cdx") {
            console.log("running cdx parser... ")
            await this.runCDXParser(obj[src], obj[dest], obj)
        }
        else if(obj[mode] ==="createCDX") {
            console.log("running cdx creator... ")
            await this.runCDXCreator(obj[src], obj[dest], obj)
        }
        else {
            console.log("ERROR: please add a valid mode field to your arguments {}");
            return;
        }
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
                    if(err) return console.log(err);
                    // deletes the destination file before proceeding
                    resolve(true);
               });  
            }
                
        });
    });
    }

    /**
     * Parses object into JS Object format
     * @param {string} input string of arguments
     * @returns {object}
     */
    parseArgs = (input) => {
        let split = input.split(/\s+/);

        let currentFlag = ""
        let obj = {}
        for(let next of split) {
            let parsed = next.replace(/:/g, '')
            if(this.flags.includes(parsed)){ 
                currentFlag = parsed;
                obj[currentFlag] = ""
            }
            else {
                let curr = obj[currentFlag] 
                curr += next
                obj[currentFlag] = curr;
            }
        }

        return this.formatArgs(obj);
    }

    /**
     * Formats the arguments into the object further
     * @param {object} obj the arguments
     * @returns formatted object
     */
    formatArgs = (obj) => {

        if(obj[src] !== undefined) {
            let arr = obj[src].split(",")
            obj[src] = arr
        }
        
        if(obj[dest]!== undefined) {
            
            if(obj[dest].includes('.gz')) {
                obj['compressed'] = true
            }
            let arr = obj[dest].split(",")
            obj[dest] = arr
        }
        
        if(obj[fileType] !== undefined) {
            let arr = obj[fileType].split(",")
            obj[fileType] = arr
        }
        
        if(obj[url] !== undefined) {
            let arr = obj[url].split(",")
            obj[url] = arr
        }
        
        if(obj[date] !== undefined) {
            let arr = obj[date].split("-")
            obj[date] = arr
        }

        if(obj[compressed] === undefined) {
            obj[compressed] = "false";
        }



        return obj;
    }

    /**
     * Runs the warc parser
     * @param {array} origDir warc file path
     * @param {array} destDir where files will be written to path
     * @param {object} args the arguments
     */
    runWarcParser = async (origDir, destDir, args) => {
        let t0 = Date.now();
        let totalCount = 0;

        for (let next of origDir) {
            let warcParser = new WarcParser(next, destDir[0], args)
            await warcParser.asyncParse();
            totalCount += warcParser.getRecordCount();

            if(args[recordLimit] !== undefined && totalCount >= recordLimit) {
                break;
            }
            else if(args[recordLimit] !== undefined) {
                args[recordLimit] = args[recordLimit] - totalCount;
            }
        }
    
        let t1 = Date.now();
        let seconds = ((t1 - t0)) / 1000;
        seconds = Number((seconds).toFixed(6))
        let total = seconds + " seconds were needed to for the warc filter and write \n\n";
        console.log(total);
      }

      /**
       * Runs the CDX Parser
       * @param {array} origDir the directory of the CDX file
       * @param {array} destDir the directory of the dest file to write
       * @param {object} args the arguments
       */
      runCDXParser = async (origDir, destDir, args) => {
        let t0 = Date.now();

        let totalCount = 0;
        for (let next of origDir) {
            let cdxParser = new CDXParser(next, destDir[0], args)
            await cdxParser.asyncParse();
            totalCount += cdxParser.getCount();

            if(args[recordLimit] !== undefined && totalCount >= recordLimit) {
                break;
            }
            else if(args[recordLimit] !== undefined) {
                args[recordLimit] = args[recordLimit] - totalCount;
            }
        }

        let t1 = Date.now();
        let seconds = ((t1 - t0)) / 1000;
        seconds = Number((seconds).toFixed(6))
        let total = seconds + " seconds were needed to for the cdx index filter read warc and write \n\n";
        console.log(total);
    }

    /**
     * Runs the cdx creator
     * @param {array} origDir the path of the warc file
     * @param {array} destDir the path of the cdx file to write to
     * @param {object} args the
     */
    runCDXCreator = async (origDir, destDir, args) => {
        let cdCreate = new CDXCreator(origDir[0], destDir[0], args)
        let t0 = Date.now();
        await cdCreate.createCDX()
        let t1 = Date.now();
        let seconds = ((t1 - t0)) / 1000;
        seconds = Number((seconds).toFixed(6))
        let total = seconds + " seconds were needed to create the cdx file \n\n";
        console.log(total)
    }
}

module.exports = Main;
