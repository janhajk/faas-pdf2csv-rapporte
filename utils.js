var fs = require('fs');
var config = require(__dirname + '/config.js');


let array2csv = function(data, delimiter = ';') {
      var file = "";

      // first format the numbers
      for (let i = 0; i < data.length; i++) {
            let keys = Object.keys(data[i]);
            for (let r = 0; r < keys.length; r++) {
                  if (typeof data[i][keys[r]] !== 'number') {
                        data[i][keys[r]] = '"' + data[i][keys[r]] + '"';
                  }
            }
      }

      // create lines
      for (let i = 0; i < data.length; i++) {
            let values = Object.values(data[i]);
            let line = values.join(delimiter);
            line += "\n";
            file += line;
      }
      return file;
};
exports.array2csv = array2csv;


let csvExport = function(res, allLines, filename) {
      let csv = array2csv(allLines);
      res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attchment; filename=' + filename + '.csv'
      });
      res.write('﻿' + csv);
      res.end();
};
exports.csvExport = csvExport;


const fileListSimple = function(files) {
      let list = [];
      for (let i = 0; i < files.length; i++) {
            list.push({
                  name: files[i][1].name,
                  path: files[i][1].path
            });
      }
      return list;
};
exports.fileListSimple = fileListSimple;
