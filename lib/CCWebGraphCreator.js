/**
 *  Generates a Web graph pair file in
 * 'url url' form per line from a Common Crawl WAT path found at 
 *  https://commoncrawl.org/the-data/get-started/
 * 
 */

 let readline = require("readline"); 
 let fs = require('graceful-fs');
 let zlib = require('zlib');
 let fetch = require('node-fetch');
 let WatParser = require('./WatParser')

 // common crawl base url
 const baseURL = 'https://commoncrawl.s3.amazonaws.com/'

 class CCWebGraphCreator {
     constructor(origPath, destPath, args = {}) {
         this.origPath = origPath
         this.destPath = destPath;

         this.count = 0;
         this.watCount = 0// keep track the number of WAT files we have read
         this.pairCount = 0;
         this.args = args;

         if(typeof this.args['watLimit'] !== 'undefined') {
            this.watLimit = parseInt(this.args['watLimit']);
        }
        else {
            this.watLimit = Number.MAX_VALUE;
        }

        if(typeof this.args['pathOffset'] !== 'undefined') {
            this.pathOffset = parseInt(this.args['pathOffset']);
        }
        else {
            this.pathOffset = 0
        }
     }

     generateGraphFile = async () => {
        let lineReader = this.readFile();

        let lineCount = 0;
        for await(let line of lineReader) {
            if(lineCount < this.pathOffset) {
                lineCount += 1;
                continue;
            }

            if(this.watCount >= this.watLimit) {
                break;
            }
            await this.processWAT(line)
            this.watCount += 1;
        }
        await this.compressFile();
        await this.createInfoFile();

     }

    processWAT = async (line) => {
         let url = baseURL + line
         console.log("currently writing from +" + url + "\n")
         let res = await fetch(url)
         let watParser = new WatParser(url, this.destPath, {}, res.body);
         await watParser.asyncParse();
         let total = watParser.getPairCount();
         this.pairCount += total;
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

    delOrigFile = async () => {

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

    readFile = () => {
        let stream = fs.createReadStream(this.origPath).pipe(zlib.createGunzip())
        return readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        })
    }

    createInfoFile = async () =>{
        return new Promise( async (resolve, reject) => {
        let infoPath = this.destPath + ".info"
        let infoWrite = fs.createWriteStream(infoPath, {flags:'a'});
        let edges = "The total number pairs in " + this.destPath + " is " + this.pairCount;
        infoWrite.write(edges);
        resolve(true)
    });
    }
   
 }
 module.exports = CCWebGraphCreator;