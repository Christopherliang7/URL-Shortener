const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const Auth = require('./middleware/auth');

const models = require('./models');
const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(require('./middleware/cookieParser'));
app.use(Auth.createSession);



app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

// login
app.get('/login', (req, res) => {
  res.render('login');
  models.Session.create()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

// Post/ login => verifying identity, compare passwords, using the salt and hashing function
app.post('/login', (req, res, next) => {
  Promise.resolve(models.Users.getAll()).then((data) => {
    //if statement
    var validUser = false;
    for (var user of data) {
      if (user.username === req.body.username) {
        validUser = user;
      }
    }
    if (validUser) {
      Promise.resolve(models.Users.compare(req.body.password, validUser.password, validUser.salt)).then((correct) => {
        if (correct) {
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
        next(null, res, null);
      });
      //check password
    } else {
      throw new Error('Incorrect username');
    }
  }).catch((err) => {
    res.redirect('/login');
    next(null, res, null);
  });
});

// sign up
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Post/ signup => establishing identity, storing username and password
app.post('/signup', (req, res, next) => {
  // get username, check if it exists
  // check database for username
  // get works because user is an extension of model class
  // this checks username
  Promise.resolve(models.Users.getAll()).then((data) => {
    //if statement
    var taken = false;
    for (var user of data) {
      if (user.username === req.body.username) {
        taken = true;
      }
    }
    if (taken) {
      throw new Error('Name taken');
    } else {
      Promise.resolve(models.Users.create(req.body)).then(() => {
        res.redirect('/');
        next();
      });
    }
  }).catch((err) => {
    res.redirect('/signup');
    next(null, res, null);
  });
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
