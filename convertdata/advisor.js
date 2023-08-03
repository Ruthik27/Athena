const mysql = require('mysql2');
const fs = require('fs');
const csv = require('fast-csv');

function run() {
    let stream = fs.createReadStream('./data_sets/advisor.csv');
    let csvData = [];
    let csvStream = csv
        .parse()
        .on('data', function(data) {
            csvData.push(data);
        })
        .on('end', function() {
        
            csvData.shift();

            const connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '8888',
                database: 'athena_schema'
            });

            let query = 'INSERT INTO Advisor (advisor_ID, advisor_Name, sid) VALUES ?';
            connection.query(query, [csvData], (error, response) => {
                console.log(error || response);
            });
        });

    stream.pipe(csvStream);
}

module.exports.run = run;
