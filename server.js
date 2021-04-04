'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 3030;
const cors = require('cors');

const app = express();
app.use(cors());

// app.use(express.static("public"));
app.use('/public', express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/hello', (req, res) => {
  res.render('pages/index');
});

app.use(express.urlencoded({ extended: true }));


app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new');
});

app.post('/searches', (req, res) => {

  const searchKeyword = req.body.searched;
  const searchBy = req.body.searchBy;
  // let url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.searchQuery}+${req.body.searchBy === 'title' ? 'intitle' : 'inauthor'}`;
  const url = `https://www.googleapis.com/books/v1/volumes?langRestrict=en&q=${searchKeyword}+in${searchBy}:`;

  superagent.get(url).then((data) => {
    console.log(data.body);
    const bookData = data.body.items;

    const book = bookData.map(item => {
      return new Book(item.volumeInfo );
    });

    res.render('pages/searches/show', { books: book });

  }).catch((err) => errorHandler(err, req, res));

});


app.use('*', (req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => console.log(`The server is running on port ${PORT}`));

function Book(data ) {
  this.title = (data.title)? data.title : 'Unknown Book Title';
  this.author = (data.authors)? data.authors : 'Unknown Book Authors';
  this.description = (data.description)? data.description : 'Description not available';
  // this.thumbnail = !(bookData.imageLinks.thumbnail)?'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png' : bookData.imageLinks.thumbnail ;
  // if(searchBy === 'author'){
  this.thumbnail = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  // }
  // else{
  // this.thumbnail = 'https://i.imgur.com/J5LVHEL.jpg';
  // }
}

//helpers
function errorHandler(err, req, res) {
  res.status(500).render('pages/error', { err :err.message});
}
