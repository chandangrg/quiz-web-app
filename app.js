// app.js

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let currentQuestionIndex = 0;
let score = 0;
let questions = [];

// Load scores from JSON file
let scores = [];
fs.readFile('scores.json', (err, data) => {
  if (err) {
    console.log('Error reading scores file:', err);
  } else {
    scores = JSON.parse(data);
  }
});

// Landing page route
app.get('/', (req, res) => {
  res.render('index');
});

// Start quiz route
app.post('/start', async (req, res) => {
  const { numQuestions, category, difficulty, type } = req.body;
  const url = `https://opentdb.com/api.php?amount=${numQuestions}&category=${category}&difficulty=${difficulty}&type=${type}`;
  
  try {
    const response = await axios.get(url);
    questions = response.data.results;
    currentQuestionIndex = 0;
    score = 0;
    res.redirect('/quiz');
  } catch (error) {
    res.render('error', { message: 'Failed to fetch questions. Please try again.' });
  }
});

// Quiz route
app.get('/quiz', (req, res) => {
  if (currentQuestionIndex < questions.length) {
    res.render('quiz', { question: questions[currentQuestionIndex] });
  } else {
    res.redirect('/result');
  }
});

// Submit answer route
app.post('/submit', (req, res) => {
  const userAnswer = req.body.answer;
  const correctAnswer = questions[currentQuestionIndex].correct_answer;

  if (userAnswer === correctAnswer) {
    score++;
  }

  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    res.render('feedback', {
      isCorrect: userAnswer === correctAnswer,
      correctAnswer,
      nextQuestionUrl: '/quiz'
    });
  } else {
    // Save score to JSON file
    scores.push(score);
    fs.writeFile('scores.json', JSON.stringify(scores), (err) => {
      if (err) {
        console.log('Error writing scores file:', err);
      } else {
        console.log('Score saved successfully.');
      }
    });
    res.redirect('/result');
  }
});

// Result route
app.get('/result', (req, res) => {
  res.render('result', {
    score,
    totalScores: scores // Pass all scores to result.ejs
  });
});

// Error handling route
app.get('/error', (req, res) => {
  res.render('error', { message: 'Page not found.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
