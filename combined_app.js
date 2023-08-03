const bcrypt = require('bcrypt');
var fs = require('fs');
var mysql = require('mysql');
var cheerio = require('cheerio');
var express = require('express');
var app = express();
var cors = require('cors');

// Serve static files from the "public" directory


// Connect to the MySQL server
var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : '8888',
  database : 'athena_schema'
});


pool.query('SELECT courses.course_Name, courses.course_Hours, courses.course_id, professors.professor_Name FROM courses JOIN professors ON courses.professor_id = professors.professor_ID', function (error, results, fields) {
  if (error) throw error;

  fs.readFile('./client/src/login/course.html', 'utf8', function(err, contents) {
    if (err) {
      console.error('An error occurred while reading the file:', err);
      return;
    }
    var $ = cheerio.load(contents);
  
    // For each row in the results...
    results.forEach(function(row) {
      // Create a new table row
      var tr = $('<tr>');
      
      // For each field in the row...
      Object.keys(row).forEach(function(field) {
        // Add a new table cell to the row
        tr.append('<td>' + row[field] + '</td>');
      });

      // Add a new table cell with a button to the row
      tr.append('<td><button>Add Course</button></td>');
      
      // Add the row to the table in the HTML
      $('table').append(tr);
    });

    // Write the updated HTML back to the file
    fs.writeFile('./client/src/login/course.html', $.html(), function(err) {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  });
});


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/src/login/course.html');
});




// Serve static files from the client/src/login directory
app.use(express.static(__dirname + '/client/src/login'));
app.use(cors());



app.listen(3006, () => console.log('server started'));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/register', function(req, res) {
  var sid = parseInt(req.body.sid);
  var password = req.body.password;
  var stu_name = req.body.stu_name;
  var age = parseInt(req.body.age);
  var gender = req.body.gender;
  var major = req.body.major;

  if (isNaN(sid)) {
    res.status(400).send('Student ID must be a number.');
    return;
  }

  bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
      console.error(err);
      return;
    }

    // Use 'hash' as the password value in the INSERT query
    var query = 'INSERT INTO students (sid, password, stu_name, age, gender, major) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(query, [sid, hash, stu_name, age, gender, major], function(error, results, fields) {
      if (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred during registration.');
        return;
      }

      // Redirect to the login page with the success parameter
      res.redirect('/login?success=true');
    });
  });
});

app.post('/course', function(req, res) {
  var sid = 811010436;
  var courseID = req.body.courseID[increment];
  var grade = 70;
  increment++;

  console.log('Received registration details:', req.body);

  var query = 'INSERT INTO enrollment (sid, course_ID, grade) VALUES (?, ?, ?)';
  pool.query(query, [sid, courseID, grade], function(error, results, fields) {
    if (error) {
      console.error('An error occurred:', error);
      res.status(500).send('An error occurred during registration.');
      return;
    }
    console.log('Query executed successfully, results:', results);
    res.send('Registration successful.');  });
});

// Login endpoint (serving the login.html file)
app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/client/src/login/login.html'); // Update the path as needed
});
