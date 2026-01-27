require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

  const routes = require('./routes')
  app.use(routes);

app.get('/', async(req, res)=>{
    try {
        res.send({message: 'Welcome to Sân Siêu Tốc!'});
    } catch (error) {
        res.send({error: error.message});
    }
});

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));