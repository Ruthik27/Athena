const xlsx = require("xlsx");
const mysql = require("mysql");

const hostname = "localhost",
    username = "root",
    password = "8888",
    dbname = "athena_schema";
  
let con = mysql.createConnection({
    host: hostname,
    user: username,
    password: password,
    port: 3306,
    database: dbname
});
  
con.connect(function(err) {
    if (err) throw err;
    var advisor = "CREATE TABLE advisor (advisor_ID VARCHAR(255), advisor_Name VARCHAR(255), sid int)";
    var courses = "CREATE TABLE courses (course_Name VARCHAR(255), course_ID VARCHAR(255), course_Hours VARCHAR(255), professor_ID VARCHAR(255))";
    var enrollment = "CREATE TABLE enrollment (sid INT, course_ID VARCHAR(255), grade int)";
    var students = "CREATE TABLE students (sid INT, stu_name VARCHAR(255), gender VARCHAR(255), age int, major VARCHAR(255), password VARCHAR(255))";
    var professors = "CREATE TABLE professors (professor_ID INT, professor_Name VARCHAR(255))";
    con.query(advisor, function (err, result) {
        if (err) throw err;
        console.log("Advisor Table created");
    });
    con.query(courses, function (err, result) {
        if (err) throw err;
        console.log("Courses Table created");
    });
    con.query(enrollment, function (err, result) {
        if (err) throw err;
        console.log("Enrollment Table created");
    });
    con.query(students, function (err, result) {
        if (err) throw err;
        console.log("Students Table created");
    });
    con.query(professors, function (err, result) {
        if (err) throw err;
	con.end();
        console.log("Professors Table created");
    });
});
