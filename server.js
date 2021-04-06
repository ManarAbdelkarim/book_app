'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 3030;
const cors = require('cors');
const pg = require('pg');
const app = express();
const DATABASE_URL = process.env.DATABASE_URL;
const client =  new pg.Client({
  connectionString: DATABASE_URL,
});

app.use(cors());


app.use(express.static('public'));
// app.use('/public', express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  const selectAll = 'select * from books ;';
  client.query(selectAll).then((data) =>{
    // console.log('data.rows[0]', data.rows);
    res.render('pages/index', {books : data.rows , count: data.rows.length});
  // res.render('pages/index');
  }).catch((err) => errorHandler(err, req, res));
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
    // console.log(data.body);
    const bookData = data.body.items;

    const book = bookData.map(item => {
      return new Book(item.volumeInfo );
    });

    res.render('pages/searches/show', { books: book });

  }).catch((err) => errorHandler(err, req, res));

});



app.post('/books', (req,res) => {
  const { title, author, description, image_url , offShelf , isbn } = req.body;
  const values = [title, author, description, image_url , offShelf ,isbn ];
  const sqlSearch = `SELECT * FROM books WHERE isbn = '${isbn}' ;`;
  client.query(sqlSearch).then((searchedResult) => {
    // console.log('searchedResult.rows.length', searchedResult.rowCount , searchedResult.rows);
    if (searchedResult.rowCount > 0) {
      res.redirect('/');
    }
    else{
      let SQL = 'INSERT INTO books (title, author, description, image_url , offShelf ,isbn) VALUES ($1,$2,$3,$4,$5,$6);';
      client.query(SQL,values)
        .then (() => {
          res.redirect('/');
        })
        .catch((err) => {
          errorHandler(err, req, res);
        });
    }

  });
});


app.get('/books/:ID', (req,res) => {
  // console.log('now I am here');
  const SQL = `SELECT * from books WHERE ID=${req.params.ID};`;
  client.query(SQL)
    .then(result => {
      res.render('pages/books/show', { books: result.rows[0]});
    }).catch((err) => errorHandler(err, req, res));
});


app.use('*', (req, res) => {
  res.status(404).send('Page not found');
});

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('connected to db', client.connectionParameters.database); //show what database we are connected to
    console.log(`The server is running on port ${PORT}`);
  });
}).catch(error => {
  console.log('error', error);
});


function Book(data ) {
  this.title = (data.title)? data.title : 'Unknown Book Title';
  this.author = (data.authors)? data.authors : 'Unknown Book Authors';
  this.description = (data.description)? data.description : 'Description not available';
  this.thumbnail = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.isbn = data.industryIdentifiers ? `${data.industryIdentifiers[0].type} ${data.industryIdentifiers[0].identifier}` : 'Unknown ISBN';
  this.offShelf = (data.volumeInfo) ? data.volumeInfo.categories : 'The book is not in a shelf';
}

//Handler
function errorHandler(err, req, res) {
  res.status(500).render('pages/error', { err :err.message});
}

