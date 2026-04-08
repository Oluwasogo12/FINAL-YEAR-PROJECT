# RBAPS — Frontend File Guide & Database Connection Handbook

## 📁 Folder Structure

```
rbaps/
├── css/
│   ├── style.css        ← Global variables, typography, buttons, cards, utilities
│   ├── nav.css          ← Sidebar + top nav + responsive layout
│   ├── auth.css         ← Login & Register pages
│   ├── dashboard.css    ← Dashboard widgets
│   ├── practice.css     ← Practice session UI
│   └── analytics.css    ← Charts, topic bars, analytics layout
│
├── js/
│   ├── main.js          ← Shared utilities: sidebar, toast, chart helpers
│   ├── practice.js      ← Session state, question rendering, timer, results
│   └── analytics.js     ← Demo data rendering for analytics page
│
└── pages/
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── practice.html
    ├── analytics.html
    ├── profile.html
    └── partials/
        └── sidebar.html   ← Sidebar HTML snippet (use PHP include)
```

---

## 🔌 Connecting to Your PHP + MySQL Database

### Step 1 — Database Config File
Create `api/config.php`:
```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'rbaps_db');
define('DB_USER', 'root');       // your MySQL user
define('DB_PASS', '');           // your MySQL password

$pdo = new PDO(
    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
    DB_USER, DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
```

---

### Step 2 — User Registration API
Create `api/register.php`. The HTML form POSTs to this URL:
```php
<?php
require 'config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
// Or use $_POST if using a standard form
$firstname  = $_POST['firstname']  ?? '';
$lastname   = $_POST['lastname']   ?? '';
$email      = $_POST['reg-email']  ?? '';
$password   = password_hash($_POST['reg-password'], PASSWORD_DEFAULT);
$exam_target = $_POST['exam-target'] ?? 'both';

$stmt = $pdo->prepare("INSERT INTO users (firstname, lastname, email, password_hash, exam_target) VALUES (?,?,?,?,?)");
$stmt->execute([$firstname, $lastname, $email, $password, $exam_target]);

echo json_encode(['success' => true, 'user_id' => $pdo->lastInsertId()]);
```

**In `register.html`**, replace the JS `handleRegister` function with:
```javascript
async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('register-form'));
  const res = await fetch('../api/register.php', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) {
    sessionStorage.setItem('user_id', data.user_id);
    window.location.href = 'dashboard.html';
  } else {
    showToast(data.error || 'Registration failed', 'error');
  }
}
```

---

### Step 3 — Login API
Create `api/login.php`:
```php
<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

$email    = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id']   = $user['user_id'];
    $_SESSION['user_name'] = $user['firstname'] . ' ' . $user['lastname'];
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
}
```

---

### Step 4 — Questions API
Create `api/questions.php` — this is what `practice.js` will fetch:
```php
<?php
require 'config.php';
header('Content-Type: application/json');

$subject = $_GET['subject'] ?? '';
$year    = $_GET['year']    ?? '';

// Join questions → topics → subjects, filter by subject name and year
$stmt = $pdo->prepare("
    SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
           q.correct_option, q.explanation, t.topic_name
    FROM questions q
    JOIN topics t ON q.topic_id = t.topic_id
    JOIN subjects s ON t.subject_id = s.subject_id
    WHERE s.subject_name = ? AND q.exam_year = ?
    ORDER BY RAND()
    LIMIT 20
");
$stmt->execute([$subject, $year]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
```

**In `practice.js`**, replace the `beginSession` function body with:
```javascript
function beginSession() {
  fetch(`../api/questions.php?subject=${encodeURIComponent(state.selectedSubject)}&year=${state.selectedYear}`)
    .then(r => r.json())
    .then(data => {
      // Map your DB columns to the format practice.js expects
      state.questions = data.map(q => ({
        id:          q.id,
        topic:       q.topic_name,
        text:        q.question_text,
        options:     [q.option_a, q.option_b, q.option_c, q.option_d],
        answer:      ['a','b','c','d'].indexOf(q.correct_option.toLowerCase()),
        explanation: q.explanation
      }));
      state.answers   = new Array(state.questions.length).fill(null);
      state.submitted = new Array(state.questions.length).fill(false);
      state.current   = 0;
      state.phase     = 'session';
      state.startTime = Date.now();
      document.getElementById('setup-section').classList.add('hidden');
      document.getElementById('session-section').classList.remove('hidden');
      updateTopbar();
      renderQuestion();
      renderQDots();
      startTimer();
    })
    .catch(() => showToast('Failed to load questions. Check your connection.', 'error'));
}
```

---

### Step 5 — Save Performance After Session
Create `api/save_session.php`:
```php
<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

$data    = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'] ?? 0;
$subject = $data['subject'];
$year    = $data['year'];
$score   = $data['score'];          // e.g. 72.5 (percentage)
$correct = $data['correct'];
$total   = $data['total'];

// Save session record
$stmt = $pdo->prepare("
    INSERT INTO sessions (user_id, subject_name, exam_year, session_score, total_questions, started_at)
    VALUES (?,?,?,?,?,NOW())");
$stmt->execute([$user_id, $subject, $year, $score, $total]);

// Update mastery score per topic (simplified average)
foreach ($data['topic_scores'] as $topic_id => $topic_score) {
    $stmt = $pdo->prepare("
        INSERT INTO performance (user_id, topic_id, mastery_score, consecutive_correct)
        VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE
            mastery_score = (mastery_score + VALUES(mastery_score)) / 2,
            consecutive_correct = VALUES(consecutive_correct)
    ");
    $stmt->execute([$user_id, $topic_id, $topic_score['pct'], $topic_score['consecutive']]);
}

echo json_encode(['success' => true]);
```

Call this from `practice.js` inside `endSession()`:
```javascript
// Add inside endSession(), before rendering results:
fetch('../api/save_session.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: state.selectedSubject,
    year: state.selectedYear,
    score: pct,
    correct, total,
    topic_scores: {} // build this from state.questions if needed
  })
});
```

---

### Step 6 — Analytics API
Create `api/analytics.php`:
```php
<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

$user_id = $_SESSION['user_id'] ?? 0;
$subject = $_GET['subject'] ?? '';

$stmt = $pdo->prepare("
    SELECT t.topic_name, p.mastery_score
    FROM performance p
    JOIN topics t ON p.topic_id = t.topic_id
    JOIN subjects s ON t.subject_id = s.subject_id
    WHERE p.user_id = ? AND s.subject_name = ?
    ORDER BY p.mastery_score ASC
");
$stmt->execute([$user_id, $subject]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
```

Then in `analytics.js`, replace the demo data with a fetch:
```javascript
function renderSubjectAnalytics(subject) {
  fetch(`../api/analytics.php?subject=${encodeURIComponent(subject)}`)
    .then(r => r.json())
    .then(topics => {
      // topics = [{topic_name: '...', mastery_score: 72}, ...]
      // render topic bars using the same renderTopicBars() logic
    });
}
```

---

## 🗄️ Recommended MySQL Tables

```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(50), lastname VARCHAR(50),
  email VARCHAR(100) UNIQUE, password_hash VARCHAR(255),
  exam_target ENUM('utme','ssce','both') DEFAULT 'both',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
  subject_id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100), exam_type VARCHAR(20)
);

CREATE TABLE topics (
  topic_id INT AUTO_INCREMENT PRIMARY KEY,
  topic_name VARCHAR(150), subject_id INT,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

CREATE TABLE questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  question_text TEXT,
  option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT,
  correct_option CHAR(1),
  explanation TEXT,
  topic_id INT, exam_year YEAR, difficulty ENUM('easy','medium','hard'),
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);

CREATE TABLE performance (
  performance_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, topic_id INT,
  mastery_score DECIMAL(5,2) DEFAULT 0,
  consecutive_correct INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, topic_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);

CREATE TABLE sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, subject_name VARCHAR(100),
  exam_year YEAR, session_score DECIMAL(5,2),
  total_questions INT, started_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## 🚀 Quick Start

1. Place all files in your XAMPP `htdocs/rbaps/` folder
2. Start Apache + MySQL in XAMPP
3. Import the SQL tables above using phpMyAdmin
4. Create `api/config.php` with your DB credentials
5. Open `http://localhost/rbaps/pages/login.html` in your browser
6. When ready, swap the demo JS functions for `fetch()` calls to your PHP APIs as shown above

Good luck! 🎓
