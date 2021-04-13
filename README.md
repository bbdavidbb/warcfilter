# warcfilter

A simple node js cli program that filters out WARC records based on an argument criteria

## Scripts on how to run this directory 

After downloading node.js from [https://nodejs.org/en/](https://nodejs.org/en/)

After cloning this repository, in this project repository run: npm install

After the packages are done downloading run: npm start

## Arguments format and cli directions

If everything is running this cli interface should appear in console

```
Enter in this format: src: origFile dest: destinationFile mode: mode {arguments}, press e to exit:
```

Below is a list of possible arguments

- src: {comma separated list path to files to read from}   
- dest: {path of file to write warc records to}
- mode: {warc | cdx | createCDX}
- type: {cdx | cdxj} (only used in createCDX mode)
- url: {comma separated list of urls} 
- fileType: {comma separated list of file types}
- date: {yyyymmddhhmmss | yyyymmddhhmmss - yyyymmddhhmmss} (ranged queries accepted inclusive - exclusive)
- recordLimit: {int} // limit of number of records to write from filter

## Modes
- warc
  - only accepts WARC files as src
- cdx
  - only accepts CDX files as src
  - CDX files must be in same directory as it's WARC file
- createCDX
  - only accepts WARC file as src
  - has mandatory type argument field

## Example Query

```
src: ./warc/exampleCDX.cdx, ./warc/exampleCDX2.cdx, ./warc/exampleCDX3.cdx dest: ./tests/exampleCDXWriteAllOptions.txt mode: cdx url: kaze-online, google fileType: jpg, png date: 20110223 - 20110226 recordLimit: 20
```


