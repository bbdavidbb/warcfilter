/**
 * A class that has a list of prompts
 */

 const prompt = require("prompt");
 const readline = require("readline");
 const WarcParser = require('./WarcParser.js')
 const warcDir = '../warc/example.warc.gz'
 const cdxDir = '../warc/exampleCDX.cdx'
 const Record = require('./Record.js')
 const {CDXLegend} = require('./CDXLegend.js')
 const CDXParser = require('./CDXParser.js')
 const CDXToWarc = require('./CDXToWarc.js')

class Prompts {

    warcPrompt = async (rl) => {
        // let finished = true;
        // do {
        //     let yes = await this.warcPromise(rl);
        //     if(yes) {
        //         finished = false
        //         return yes;
        //     }
        // }
        // while(finished)
        // return "";
    }

    warcPromise = (rl)=> {
        return new Promise((resolve, reject) => {
            rl.question("Enter warc file path relative to this folder: ", function(origPath) {
                rl.question("Enter name of file and extension relaive to where the records will be written", function(destPath) {
                    rl.question("How many records do you want to retrieve?: ", function(numRecords) {
                        rl.question("Enter your argument flags in -a 'content' format: ", function(queryParams) {
                            rl.question("Arguments retrieved successfuly press any key to continue: ", function(placeholder) {
                               let obj = {}
                               obj['origPath'] = origPath
                               obj['destPath'] = destPath
                               obj["numRecords"] = numRecords
                               obj["queryParams"] = queryParams;
                               resolve(obj);
                            });
                        });
                    });
                });
            });
        });
    }

    cdxPrompt = (rl) => {
       let numIndexes = rl.question("How many indexes do you want to retrieve?: ");
       let flags = rl.question("Enter your argument flags in -a 'content' format: ");
       console.log(numIndexes + flags)
       console.log("done with cdxPrompt");
    }

    cdxPromise = (rl) => {

    }
}

module.exports = Prompts;