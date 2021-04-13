/**
 * Reads CDX index, reads from corresponding WARC file in index,
 * outputs WARC record to destination
 */

let fs = require('graceful-fs');
let zlib = require('zlib');

class CDXToWarc {
    constructor(cdxArr = [], origPath, destPath, compressed) {
        this.cdxArr = cdxArr;
        this.origPath = origPath
        this.destPath = destPath;

        let pathArr = this.origPath.split('/');
        this.cdxName = pathArr[pathArr.length - 1]
        this.compressed = compressed;
    }

    /**
     * Takes cdx index's warc record offset and length 
     * extracts record the writes to destPath 
     * @param {string} warcDir The path of the warc file
     * @param {int} recordOffset WARC record offset
     * @param {int} recordLength WARC record lenghth
     */
    writeFile = async (warcDir, recordOffset, recordLength) => {
        let endOfRecordPos = recordOffset + recordLength;
        let sizeOfChunk = recordLength + 1;

        let decompressStream = zlib.createGunzip().on('data', function (chunk) {
            //decompressStream.pause();
        }).on('error', function(err) {
            console.log("decompress stream of CDXToWarc: " + err);
        });

        fs.createReadStream(warcDir, {start: recordOffset, end: endOfRecordPos, chunkSize: sizeOfChunk})
        .on('data', function (chunk) {
            decompressStream.write(chunk);
        });

        let destStream = fs.createWriteStream(this.destPath, {flags:'a'}).on('error', function(err) {});;
        decompressStream.pipe(destStream)
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
     * Loops through cdx indexes and writes file
     */
    writeRecordFromIndex = async () => {
    return new Promise( async (resolve, reject) => {
    for (let index of this.cdxArr) {
        let recordLength = parseInt(index['compressed record size']);
        let recordOffset = parseInt(index['compressed arc file offset *']);
        let warcDir = this.origPath.replace(this.cdxName, index['file name'])
        await this.writeFile(warcDir, recordOffset, recordLength);
    }

    if(this.compressed === "true") {
        await this.compressFile();
    }
    resolve(true);
   });
    }
}

module.exports = CDXToWarc;