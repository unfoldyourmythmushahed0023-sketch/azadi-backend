const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Azadi API is working on port 5001!' });
});

app.listen(5001, () => {
  console.log('✅ Server is running on http://localhost:5001');
});
