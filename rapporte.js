/**
 *
 *

      TODO:
      Output directly to XLSM with:
      https://github.com/sheetjs/sheetjs

*/



let PDFParser = require('pdf2json');


const HEADER = ['Datei', 'Seite', 'GL/Na/ZL', 'Planer', 'Name', 'Datum', 'Kat.', 'Tätigkeitsbeschrieb', 'Std.'];




function stream2buffer(stream) {
      console.log('running stream2buffer for file', stream);
      return new Promise((resolve, reject) => {

            const _buf = [];

            stream.on("data", (chunk) => _buf.push(chunk));
            stream.on("end", () => resolve(Buffer.concat(_buf)));
            stream.on("error", (err) => reject(err));

      });
}



const pdf2json = function(file) {
      return new Promise((resolve, reject) => {
            let pdfParser = new PDFParser();
            pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));

            // Callback Function
            pdfParser.on('pdfParser_dataReady', function(pdfData) {
                  resolve(pdfData.formImage.Pages);
            });

            stream2buffer(file)
                  .then(buff => {
                        pdfParser.parseBuffer(buff);
                  })
                  .catch(e => console.log(e));
      });
};


/**
 *
 *
 * Parse a pdf into json object
 *
 *
 * @returns {Promise} allLines: JSON Object of pdf
 *
 *
 *
 *
 */
const pdf2jsonPages = async function(file) {

      if (file.length === 1) file = file[0];

      const params = { headerbeginning: 'GL/' };

      let allDocuments = {};
      // for (let i in files) {
      allDocuments[file['filename']] = await pdf2json(file);
      console.log('parsed document', file['filename']);
      // }

      console.log(allDocuments);

      allDocuments = remapData(allDocuments);
      allDocuments = sortByPageThenY(allDocuments);
      allDocuments = groupContentByLines(allDocuments);
      allDocuments = removePagesBeforeDataStarts(allDocuments);
      allDocuments = removeEverythingNotTable(allDocuments, params);
      allDocuments = removeUnwantedLines(allDocuments, params);
      allDocuments = addNameToEveryLine(allDocuments);
      allDocuments = concatMultiLiners(allDocuments);
      let lines = finalRemap(allDocuments);
      console.log('Final lines', lines);
      return lines;
};
exports.pdf2jsonPages = pdf2jsonPages;



const finalRemap = function(documents) {
      let lines = [];
      for (let name in documents) {
            let keysLineNumbers = Object.keys(documents[name]);
            keysLineNumbers.forEach((currentValue, index, arr) => {
                  lines.push({
                        Datei: documents[name][currentValue][0].fileName,
                        Seite: documents[name][currentValue][0].page,
                        'GL/NA/ZL': documents[name][currentValue][0].text,
                        Planer: documents[name][currentValue][1].text,
                        Name: documents[name][currentValue][2].text,
                        Datum: documents[name][currentValue][3].text,
                        'Kat.': documents[name][currentValue][4].text,
                        'Tätigkeistbeschrieb': documents[name][currentValue][5].text,
                        'Std.': documents[name][currentValue][6].text
                  });
            });
      }
      return lines;
};




const concatMultiLiners = function(documents) {
      let documentsNew = {};
      for (let name in documents) {
            documentsNew[name] = {};
            let index = 0;
            for (let lineNr in documents[name]) {
                  let keysLineNumbers = Object.keys(documents[name]);
                  if (documents[name][lineNr].length === 1) {
                        const previousLineKey = keysLineNumbers[index - 1];
                        let previousLine = documents[name][previousLineKey];
                        const value = documents[name][lineNr][0].text;
                        previousLine[5].text += ' ' + value;
                        delete documents[name][lineNr];
                  }
                  else {
                        documentsNew[name][lineNr] = documents[name][lineNr];
                        index++;
                  }
            }
      }
      return documentsNew;
};



const addNameToEveryLine = function(documents) {
      for (let name in documents) {
            let keysLineNumbers = Object.keys(documents[name]);
            let curName = '';
            keysLineNumbers.forEach((currentValue, index, arr) => {
                  if (documents[name][currentValue].length === 7) curName = documents[name][currentValue][2];
                  if (documents[name][currentValue].length === 6) { // => missing name! else it should have 7 cells
                        documents[name][currentValue].splice(2, 0, curName);
                  }
            });
      }
      return documents;
};




const removeUnwantedLines = function(documents, params) {
      const UNWANTED_CONTAINING = [{
                  regexp: 'Summe$',
                  index: 2
            },
            {
                  regexp: '^Total$',
                  index: 0
            },
            {
                  regexp: '^' + params.headerbeginning,
                  index: 0
            }
      ];

      let documentsNew = {};
      for (let name in documents) {
            documentsNew[name] = {};
            for (let lineNr in documents[name]) {
                  let skip = false;
                  for (let key of UNWANTED_CONTAINING) {
                        let r = new RegExp(key.regexp);
                        if (documents[name][lineNr][key.index] && r.test(documents[name][lineNr][key.index].text)) skip = true;
                  }
                  if (skip) continue;
                  documentsNew[name][lineNr] = documents[name][lineNr];
            }
      }
      return documentsNew;
};


const removeEverythingNotTable = function(documents, params) {
      const TABLE_INDICATOR = new RegExp('^' + params.headerbeginning);
      let documentsNew = {};
      for (let name in documents) {
            documentsNew[name] = {};
            let hasStarted = false;
            for (let lineNr in documents[name]) {
                  if (/^Seite/.test(documents[name][lineNr][0].text)) {
                        continue;
                  }
                  if (hasStarted) {
                        documentsNew[name][lineNr] = documents[name][lineNr];
                        continue;
                  }
                  for (let cell of documents[name][lineNr]) {
                        if (TABLE_INDICATOR.test(cell.text)) {
                              hasStarted = true;
                              documentsNew[name][lineNr] = documents[name][lineNr];
                              continue;
                        }
                  }
            }
      }
      return documentsNew;
};



const removePagesBeforeDataStarts = function(documents) {
      const FIRSTPAGE_INDICATOR = new RegExp('Detailrapport$');
      let documentsNew = {};
      for (let name in documents) {
            documentsNew[name] = {};
            let hasStarted = false;
            for (let lineNr in documents[name]) {
                  if (hasStarted) {
                        documentsNew[name][lineNr] = documents[name][lineNr];
                        continue;
                  }
                  for (let cell of documents[name][lineNr]) {
                        if (FIRSTPAGE_INDICATOR.test(cell.text)) {
                              hasStarted = true;
                              continue;
                        }
                  }
            }
      }
      return documentsNew;
};


/**
 *
 *
 *
 *
 */
const sortByPageThenY = function(documents) {
      for (let i in documents) {
            documents[i].sort(function(a, b) {
                  if (a.page > b.page) { return 1; }
                  else if (a.page < b.page) { return -1; }
                  else {
                        if (a.y > b.y) return 1;
                        else if (a.y < b.y) return -1;
                        else {
                              if (a.x > b.x) return 1;
                              else if (a.x < b.x) return -1;
                              else return 0;
                        }
                  }
            });
      }
      return documents;
};



/**
 *
 *
 *
 *
 */
const groupContentByLines = function(documents) {
      let documentsLined = {};
      for (let i in documents) {
            documentsLined[i] = {};

            // iterate cells
            for (let r = 0; r < documents[i].length; r++) {
                  const yRoundedAndPage = (documents[i][r].page * 10000) + Math.round(documents[i][r].y * 10);
                  if (!documentsLined[i][yRoundedAndPage]) documentsLined[i][yRoundedAndPage] = [];
                  documentsLined[i][yRoundedAndPage].push(documents[i][r]);
            }
      }

      return documentsLined;
};



/**
 *
 * Remap data to only necessary (strip formating etc)
 *
 *
 */
const remapData = function(documents) {

      let documentsClean = {};
      // iterate through documents
      for (let i in documents) {
            let pageClean = [];
            // iterate pages
            for (let pageIndex = 0; pageIndex < documents[i].length; pageIndex++) {
                  // iterate  texts of page
                  for (let textIndex = 0; textIndex < documents[i][pageIndex].Texts.length; textIndex++) {
                        let text = {
                              text: decodeURIComponent(documents[i][pageIndex].Texts[textIndex].R[0].T), // DecodeURI is necessery for example "%3A" => ":"
                              x: documents[i][pageIndex].Texts[textIndex].x,
                              y: documents[i][pageIndex].Texts[textIndex].y,
                              width: documents[i][pageIndex].Texts[textIndex].w,
                              page: pageIndex + 1,
                              fileName: i
                        };
                        pageClean.push(text);
                  }
            }
            documentsClean[i] = pageClean;
      }
      return documentsClean;
};
