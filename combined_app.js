const bcrypt = require('bcrypt');
var fs = require('fs');
var mysql = require('mysql');
var cheerio = require('cheerio');
var express = require('express');
var app = express();
var cors = require('cors');
var cookieParser = require('cookie-parser');





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


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

     
      res.redirect('/login?success=true');
    });
  });
});


app.get('/login', function(req, res) {
  res.sendFile(__dirname + '/client/src/login/login.html'); 
});


app.post('/login', function(req, res) {
  var sid = req.body.sid;
  var password = req.body.password;

  // Check for admin credentials
  if (sid === "000000000" && password === "admin") {
    res.json({ success: true, redirectUrl: './admin.html' }); 
    return;
  }

  var numericSid = parseInt(sid);
  if (isNaN(numericSid)) {
    res.status(400).json({ success: false, message: 'Student ID must be a number.' });
    return;
  }

  // Query the database to get the hashed password associated with the sid
  pool.query('SELECT password FROM students WHERE sid = ?', [numericSid], function(error, results, fields) {
    if (error || results.length === 0) {
      res.status(500).json({ success: false, message: 'An error occurred during login or user not found.' });
      return;
    }

    // Fetch the hashed password from the query results
    var hashedPassword = results[0].password;

    // Use bcrypt to compare the entered password with the hashed password
    bcrypt.compare(password, hashedPassword, function(err, result) {
      if (err) {
        res.status(500).json({ success: false, message: 'An error occurred during password verification.' });
        return;
      }

      // If the passwords match, redirect to the profile page
      if (result) {
        res.json({ success: true, redirectUrl: '/profile.html' });
      } else {
        res.status(401).json({ success: false, message: 'Wrong password!' }); 
      }
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

app.use(cookieParser());




app.get('/profile/:sid', (req, res) => {
  const sid = req.params.sid;
  const sql = 'SELECT stu_name, sid, major, age, gender FROM students WHERE sid = ?';
  pool.query(sql, [sid], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});

app.get('/profile', (req, res) => {
  const sid = req.cookies.sid; // Retrieve SID from the cookie

  // Query to fetch profile data for the student
  const profile_sql = 'SELECT stu_name, sid, major, age, gender FROM students WHERE sid = ?';
  pool.query(profile_sql, [sid], (err, profile_result) => {
    if (err) throw err;

    // Query to fetch enrollment data for the student
  const enrollment_sql = 'SELECT course_ID FROM enrollment WHERE sid = ?';
  pool.query(enrollment_sql, [sid], (err, enrollment_result) => {
    if (err) throw err;

    // Extract course IDs from the enrollment result
    const course_ids = enrollment_result.map(enrollment => enrollment.course_ID);

    // Fetch course details by joining with the courses and professors tables
    const course_sql = 'SELECT courses.course_Name, courses.course_Hours, courses.course_ID, professors.professor_Name FROM courses JOIN professors ON courses.professor_ID = professors.professor_ID WHERE courses.course_ID IN (?)';
    pool.query(course_sql, [course_ids], (err, course_result) => {
      if (err) throw err;

        // Combine profile and course details into a single object
        const response = {
          profile: profile_result[0],
          courses: course_result
        };

        
        res.json(response);
      });
    });
  });
});





