# 📘 Athena Course Registration Portal

![version](https://img.shields.io/badge/version-1.0.0-blue)
![build](https://img.shields.io/badge/build-passing-brightgreen)
![database](https://img.shields.io/badge/database-MySQL-orange)

A robust web-based **course registration portal** offering a seamless experience for administrators and students. Administrators can effortlessly add courses, and students can view and register for these courses, all in one place.

---

## 🚀 Features

- **🔐 User Authentication**:
    - Secure registration and profile creation.
    - Passwords are safely hashed using `bcrypt`.
    - Individualized login granting access to personal profiles and course registrations.

- **📚 Course Management**:
    - Exclusive course addition rights for administrators.
    - A visual display of available courses for students with an intuitive "Add Course" button.
    - Real-time fetch of course details from the integrated database.

- **💽 Database Integration**:
    - Seamlessly integrates with MySQL.
    - Dedicated connection to the `athena_schema` database.

- **🌐 Dynamic Content Generation**:
    - Leverages `cheerio` for on-the-fly generation of course lists.

---

## 🔧 Technical Stack

- **Backend**: `Express.js`
- **Frontend**: `EJS`
- **Database**: `MySQL`
- **Password Security**: `bcrypt`
- **Session Handling**: `express-session`
- **Additional Libraries**: `cheerio`, `cors`, `body-parser`

---

## 📂 Directory Structure

- **Static Assets**: Sourced from `public` & `client/src/login`.
- **Dynamic Content**: Found in `client/src/login/course.html`.

---

## 🛠 Setup & Execution

1. 🔽 Install necessary dependencies:
    ```bash
    npm install
    ```

2. 🔄 Ensure MySQL is active and `athena_schema` is ready.

3. ▶ Start the application:
    ```bash
    node combined_app.js
    ```

🌍 The portal is now live on port `3006`.

---

⚠ **Security Alert**: Always prioritize safety! Refrain from storing database credentials in the source code. Opt for environment variables or an external configuration file.

---
## License 📜

📌 This project is licensed under the [MIT License](LICENSE)
