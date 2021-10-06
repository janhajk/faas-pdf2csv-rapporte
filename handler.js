'use strict';

// Middleware for Fileuploads

var Multipart = require('lambda-multipart');


const parseMultipartFormData = async event => {
  return new Promise((resolve, reject) => {
    const parser = new Multipart(event);

    parser.on("finish", result => {
      resolve({ fields: result.fields, files: result.files });
    });

    parser.on("error", error => {
      return reject(error);
    });
  });
};



module.exports.pdf2csv = async(event, context) => {

  let gpg = require('rapporte.js');



  let { fields, files } = await parseMultipartFormData(event);


  // console.log('Files', files);
  console.log('Fields', fields);

  let arrLines = await gpg.pdf2jsonPages(files);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(arrLines)
  };
};
