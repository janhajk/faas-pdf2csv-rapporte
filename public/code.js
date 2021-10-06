/*global $*/
(function() {

      // function sendFiles(files) {
      //       const uri = "/upload";
      //       const xhr = new XMLHttpRequest();
      //       const fd = new FormData();

      //       xhr.open("POST", uri, true);
      //       xhr.onreadystatechange = function() {
      //             if (xhr.readyState == 4 && xhr.status == 200) {
      //                   console.log(xhr.responseText); // handle response.
      //             }
      //       };
      //       fd.append('file', files);
      //       // Initiate a multipart/form-data upload
      //       xhr.send(fd);
      // }

      const array2csv = function(data, delimiter = ';') {
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


      /**
       *
       * document Loaded listener
       *
       * this executes on DocumentLoaded
       *
       *
       */
      document.addEventListener('DOMContentLoaded', function() {



            let uploadForm = function() {
                  let frmInput = function(params) {
                        let formGroup = function() {
                              let div = document.createElement('div');
                              div.className = 'form-group';
                              return div;
                        };
                        let lbl = function(target, value) {
                              let l = document.createElement('label');
                              l.setAttribute('for', target);
                              l.className = 'form-group';
                              l.innerHTML = value;
                              return l;
                        };
                        let inpt = function(type, name, value) {
                              let input = document.createElement('input');
                              input.setAttribute('type', type);
                              input.className = 'form-control';
                              input.setAttribute('name', name);
                              if (type === 'file') {
                                    input.setAttribute('multiple', 'multiple');
                                    input.setAttribute('name', name + '[]');
                              }
                              if (params.text !== undefined) {
                                    input.value = params.text;
                              }
                              return input;
                        };
                        let dropdown = function(name, options) {
                              let select = document.createElement('select');
                              select.className = 'form-control';
                              select.setAttribute('name', name);
                              for (let i in options) {
                                    let option = document.createElement('option');
                                    option.setAttribute('value', options[i].value);
                                    option.innerHTML = options[i].text;
                                    select.appendChild(option);
                              }
                              return select;
                        };
                        if (params.type === undefined) {
                              params.type = 'text';
                        }
                        let div = formGroup();
                        let label = lbl(params.name, params.label);
                        let input;
                        if (params.type === 'dropdown') {
                              input = dropdown(params.name, params.options);
                        }
                        else {
                              input = inpt(params.type, params.name, params.text);
                        }
                        if (params.showLabel !== undefined || !params.showLabel) {
                              div.appendChild(label);
                        }
                        div.appendChild(input);
                        if (params.type === 'file') {
                              $(input).filestyle({
                                    theme: 'blue',
                                    text: ' Dateien ausw&auml;hlen',
                                    dragdrop: false,
                              });
                        }
                        return div;
                  };
                  var content = document.getElementById('frmUpload');
                  var form = document.createElement('form');
                  form.action = 'https://h7reuf1hhf.execute-api.eu-west-1.amazonaws.com/csv';
                  form.method = 'post';
                  form.enctype = 'multipart/form-data';

                  let formPdfAnalysis = [{
                        name: 'fileupload',
                        type: 'file',
                        label: 'Dateien:',
                        showLabel: false
                  }];
                  for (let i in formPdfAnalysis) {
                        form.appendChild(frmInput(formPdfAnalysis[i]));
                  }
                  content.appendChild(form);
            }();


            $(':file').on('change', function() {
                  getLines(this.files);
            });


            const getLines = async function(files) {
                  let lines = await new Promise((resolve, reject) => {
                        let counter = 0;
                        let lines = [];
                        for (let file of files) {
                              console.log('uploading', file);
                              let fData = new FormData();
                              fData.append('file', file);
                              $.ajax({
                                    url: 'https://mgj52989la.execute-api.eu-west-1.amazonaws.com/dev/csv',
                                    type: 'POST',
                                    data: fData,
                                    cache: false,
                                    contentType: false,

                                    processData: false
                              }).done(data => {
                                    lines = lines.concat(data);
                                    counter++;
                                    if (counter === files.length) {
                                          resolve(lines);
                                    }
                              });
                        }
                  });
                  console.log(lines);

                  let datum = lines[0].Datum;
                  datum = '20' + datum.split('.').reverse().join('-').substr(0, 5);

                  let csv = array2csv(lines);

                  window.URL = window.URL || window.webkitURL;
                  let blobObj = new Blob(["﻿", csv]);
                  const fileUrl = window.URL.createObjectURL(blobObj);
                  let a = document.createElement('a');
                  a.href = fileUrl;
                  a.download = datum + '_Zusammenzug.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
            };

      });

})();
