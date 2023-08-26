const bcrypt = require('bcrypt');
var fs = require('fs');
var mysql = require('mysql');
var cheerio = require('cheerio');
var express = require('express');
var session = require('express-session');
var app = express();
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Change to true if using HTTPS
}));
var cors = require('cors');
var cookieParser = require('cookie-parser');


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

      // Redirect to the login page with the success parameter
      res.redirect('/login?success=true');
    });
  });
});

var increment = 0

app.post('/course', function(req, res) {
  var sid = req.session.sid;

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


app.post('/login', function(req, res) {

    // Assuming 'sid' contains the logged-in student's ID after login is verified
    // Storing sid in the session upon successful login
    var sid = req.body.sid;
    req.session.sid = sid;
  var password = req.body.password;

  // Check for admin credentials
  if (sid === "000000000" && password === "admin") {
    res.json({ success: true, redirectUrl: './admin.html' }); // Redirect to the admin page
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
        res.status(401).json({ success: false, message: 'Wrong password!' }); // Pop up error saying wrong password
      }
    });
  });
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

// Endpoint to fetch both profile and courses for the logged-in student
app.get('/profile', (req, res) => {
  // Fetch sid from the session
  const sid = req.session.sid;

  // First, fetch the profile details
  const profile_sql = 'SELECT stu_name, sid, major, age, gender FROM students WHERE sid = ?';
  pool.query(profile_sql, [sid], (err, profile_result) => {
      if (err) {
          res.status(500).json({ success: false, message: 'An error occurred while fetching profile data.' });
          return;
      }

      // Next, fetch the courses the student has registered for
      const courses_sql = 'SELECT courses.course_Name, courses.course_Hours, courses.course_ID, courses.professor_ID FROM enrollment JOIN courses ON enrollment.course_ID = courses.course_ID WHERE enrollment.sid = ?';
      pool.query(courses_sql, [sid], (err, courses_result) => {
          if (err) {
              res.status(500).json({ success: false, message: 'An error occurred while fetching courses data.' });
              return;
          }

          // Render the profile.html page with both profile data and courses data
          fs.readFile('./client/src/login/profile.html', 'utf8', function(readErr, contents) {
              if (readErr) {
                  res.status(500).send('Error reading profile page.');
                  return;
              }

              // Replace profile placeholders
              let renderedHtml = contents.replace('{NAME}', profile_result[0].stu_name)
                                         .replace('{SID}', profile_result[0].sid)
                                         .replace('{MAJOR}', profile_result[0].major)
                                         .replace('{AGE}', profile_result[0].age)
                                         .replace('{GENDER}', profile_result[0].gender);

              // Replace courses table placeholders
              let courses_table_rows = '';
              for (const course of courses_result) {
                  courses_table_rows += `<tr>
                      <td>${course.course_Name}</td>
                      <td>${course.course_Hours}</td>
                      <td>${course.course_ID}</td>
                      <td>${course.professor_name}</td>
                  </tr>`;
              }
              renderedHtml = renderedHtml.replace('{COURSES}', courses_table_rows);

              res.send(renderedHtml);
          });
      });
  });
});

// Endpoint to add a course
app.post('/addCourse', (req, res) => {
  // Extract course details from the request body
  const { course_Name, course_Hours, course_ID, professor_ID } = req.body;

  // Prepare the SQL query
  const sql = 'INSERT INTO courses (course_Name, course_ID, course_Hours, professor_ID) VALUES (?, ?, ?, ?)';

  // Execute the query
  pool.query(sql, [course_Name, course_ID, course_Hours, professor_ID], (error, results) => {
    if (error) {
      console.error('Error inserting course:', error);
      res.status(500).json({ success: false });
      return;
    }
    res.json({ success: true });
  });
});




// Profile route to display student details
app.get('/profile', function(req, res) {
    var sid = req.session.sid;  // Retrieve sid from the session

    // Fetch student data from the database using the sid
    var query = 'SELECT * FROM students WHERE sid = ?';
    pool.query(query, [sid], function(error, results, fields) {
        if (error) {
            console.error('An error occurred:', error);
            res.status(500).send('An error occurred fetching student data.');
        } else {
            // Render the profile page with the fetched data
            res.render('profile', { student: results[0] });
        }
    });
});

// Route to fetch student data and send it as JSON
app.get('/profile-data', function(req, res) {
    var sid = req.session.sid;  // Retrieve sid from the session

    // Fetch student data from the database using the sid
    var query = 'SELECT * FROM athena_schema.students WHERE sid = ?';
    pool.query(query, [sid], function(error, results, fields) {
        if (error) {
            console.error('An error occurred:', error);
            res.status(500).send('An error occurred fetching student data.');
        } else {
            // Send the fetched data as JSON
            res.json(results[0]);
        }
    });
});
