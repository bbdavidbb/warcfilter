# warcfilter

A simple node js cli program that filters out WARC records based on an argument criteria

## Scripts on how to run this directory 

After downloading node.js from [https://nodejs.org/en/](https://nodejs.org/en/)

After cloning this repository, in this project repository run: npm install

After the packages are done downloading run: either

```
npm start
```
to start the cli interface or you can directly pass in arguments with

```
node index.js {arguments}
```

## Arguments format and cli directions

If everything is running this cli interface should appear in console

```
Enter in this format: src: origFile dest: destinationFile mode: mode {arguments}, press e to exit:
```

Below is a list of possible arguments

- src: {comma separated list path to files to read from}   
- dest: {path of file to write warc records to}
- mode: {warc | cdx | createCDX, genCCWebGraph}
- type: {cdx | cdxj} (only used in createCDX mode)
- url: {comma separated list of urls} 
- fileType: {comma separated list of file types}
- date: {yyyymmddhhmmss | yyyymmddhhmmss - yyyymmddhhmmss} (ranged queries accepted inclusive - exclusive)
- recordLimit: {int} (limit of number of records to write from filter)
- watLimit: (int) (genCCWebgraph mode only limits the number of WAT files read)
- pathOffset: (int) (genCCWebgraph mode only offset into a Common Crawl path file to read)

## Modes
- warc
  - only accepts WARC files as src
- cdx
  - only accepts CDX files as src
  - CDX files must be in same directory as it's WARC file
- createCDX
  - only accepts WARC file as src
  - has mandatory type argument field
- genCCWebGraph
  - only accepts a Common crawl wat.paths.gz file as src
  - Files can be found here [https://commoncrawl.org/the-data/get-started/](Common Crawl datasets)

## Example Arguement structure

```
src: ./warc/exampleCDX.cdx, ./warc/exampleCDX2.cdx, ./warc/exampleCDX3.cdx dest: ./tests/exampleCDXWriteAllOptions.txt mode: cdx url: kaze-online, google fileType: jpg, png date: 20110223 - 20110226 recordLimit: 20
```


