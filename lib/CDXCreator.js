/**
 * Creates a CDX or CDXJ file of a given WARC file
 */

let readline = require("readline"); 
let fs = require('graceful-fs');
let zlib = require('zlib');
let warcio = require('warcio')

const CDX11Header = " CDX N b a m s k r M S V g\n"

class CDXCreator {
    constructor(origPath, destPath, args) {
        this.origPath = origPath
        this.destPath = destPath;

        this.offSetArr = []
        this.count = 0;

        this.args = args;
        this.destStream = fs.createWriteStream(destPath, {flags:'a'});

        if(this.args["type"] === "cdx") {
            this.destStream.write(CDX11Header)
        }
    }

    /**
     * main creation function 
     */
    createCDX = async () => {
        console.log("Creating your cdx at " + this.destPath + " ...");
        return new Promise( async (resolve, reject) => {
        let pathName = this.origPath.split('/');
        let fileName = pathName[pathName.length - 1]
        await this.writeFile(this.origPath, fileName)
        this.destStream.close();
        if(this.args["compressed"] === "true") {
            await this.compressFile();
        }
        console.log("Finished writing " + this.count + "  indexes total");
        resolve(true);
       });
    }

    /**
     * Writes parsed CDX indices to file
     * @param {*} warcDir The path of the warc file we are parsing
     * @param {*} fileName The name of the warc file
     */
    writeFile = async (warcDir, fileName) => {
        let indexer = new warcio.CDXIndexer();
        let stream = fs.createReadStream(warcDir)
        let files = [{reader: stream, filename: fileName}];

        for await (const cdx of indexer.iterIndex(files)) {
            if(this.args["type"] === "cdx" ){
                await this.writeIndex(indexer.serializeCDX11(cdx));
            }
            else {
                await this.writeIndex(indexer.serializeCDXJ(cdx));
            }
          }
    }

    /**
     * Writes the index itself from stream
     * @param {string} index 
     */
    writeIndex = async (index) => {
        return new Promise( async (resolve, reject) => {
            this.destStream.write(index)
            this.count++;
            resolve(true);
       });
    }

    /**
     * Compresses file in gzip format
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
     * Gets size of a file in bytes
     * @param {string} filename path of the file
     * @returns {int} file size in num of bytes
     */
     getFilesizeInBytes = async (filename) => {
            let stats = fs.statSync(filename);
            let fileSizeInBytes = stats.size;
            return fileSizeInBytes;
    }
}


module.exports = CDXCreator;