const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const validUrl = require('valid-url');
const shortid = require('shortid');
const dotenv = require('dotenv');
const app = express();
const Url = require('./models/urlSchema');
dotenv.config()
// Middleware
app.use(express.json());
app.use(cors());
// console.log(process.env.MONGO_URI)
const connectDatabase = async ()=>{   
    await mongoose.connect(process.env.MONGO_URI)

    console.log("Database connected")
}
connectDatabase()

app.post('/api/url/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const baseUrl = 'http://localhost:5000';

  // Check base url
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json('Invalid base url');
  }

  // Create url code
  const urlCode = shortid.generate();

  // Check original url
  if (validUrl.isUri(originalUrl)) {
    try {
      let url = await Url.findOne({ originalUrl });

      if (url) {
        res.json(url);
      } else {
        const shortUrl = baseUrl + '/' + urlCode;

        url = new Url({
          originalUrl,
          shortUrl,
          urlCode,
          date: new Date()
        });

        await url.save();
        res.json(url);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error');
    }
  } else {
    res.status(401).json('Invalid original url');
  }
});

// @route   GET /:shortcode
// @desc    Redirect to original URL
app.get('/:shortcode', async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.shortcode });

    if (url) {
      // Increment click count
      url.clicks++;
      await url.save();
      // return res.json(url.originalUrl);
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json('No url found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});
app.get('/api/urls', async (req, res) => {
  try {
    const urls = await Url.find().sort({ date: -1 });
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});
const port = 5000
const server = app.listen(port, ()=>{
    console.log(`server started at ${port}`)
});