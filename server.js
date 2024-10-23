const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the SCROLLING_PORTFOLIO_WEBSITE directory
app.use(express.static(path.join(__dirname)));

// Serve index.html on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/work', (req, res) => {
  res.sendFile(path.join(__dirname, 'work.html'));
});
app.get('/studio', (req, res) => {
  res.sendFile(path.join(__dirname, 'studio.html'));
});
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});
// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
