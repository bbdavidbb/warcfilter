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

 process.setMaxListeners(100);

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
 

let parser = new Main();
mainPrompt = async () => {
    rl.question("Enter in this format: src: origFile dest: destinationFile mode: mode {arguments}, press e to exit: \n", async function(input) {
        switch(input) {
            case "e":
            case "E":
                rl.close();
                process.exit(0);
            default:
              let response = await parser.run(input)
              mainPrompt();
          }
    });
}

mainPrompt();


