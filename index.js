/**
 * WARC files CLI program 
 * See README.md for more details
 * Supported filters: 
 * fileType: ".jpg", ".html", etc.
 * url: "google.com", "yahoo.com", "bing.com"
 * date: "YYYYMMDDHHMMSS" format
 * mode: "warc", "cdx"
 */

const readline = require('readline');
const Main = require('./lib/Main.js');
const WatParser = require('./lib/WatParser.js')
const fetch = require('node-fetch');
const zlib = require('zlib');
let fs = require("fs");

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

 

let parser = new Main();
mainPrompt = async () => {
    rl.question("Enter in this format: origFile, destination file, {arguments}, t for a timing test or  press e to exit: \n", async function(input) {
        switch(input) {
            case "e":
            case "E":
                rl.close();
                process.exit(0);
            default:
              await parser.run(input)
              mainPrompt();
          }
    });
}

runArgs = async (args) => {
    await parser.run(args);
}


if(process.argv.length > 2) {
    let args = process.argv.slice(2).join(" ");
    runArgs(args);
}
else {
    mainPrompt();
}


