const models = require('../models');
const Promise = require('bluebird');
const hash = require('../lib/hashUtils');

module.exports.createSession = (req, res, next) => {
  var newSession = () => {
    Promise.resolve(models.Sessions.create())
      .then(links => {
        Promise.resolve(models.Sessions.getAll()).then((data) => {
          req.session = {hash: data[data.length - 1].hash,
            user: {username: req.body.username || ''}};
          res.cookies = {shortlyid: {value: req.cookies.shortlyid || ''}};
          //console.log(req.body.username, req.session.hash);
          res.cookie('hash', req.session.hash || '');
          next();
        });
      });
  };
  if (req.cookies.shortlyid) {
    Promise.resolve(models.Sessions.get({hash: req.cookies.shortlyid})).then((data) => {
      if (data) {
        req.session = {hash: data.hash,
          user: {username: req.body.username || data.user.username}, userId: data.id};
        res.cookie('hash', req.session.hash);
        next();
      } else {
        throw new Error('Invalid session');
      }
    }).catch((err) => {
      newSession();
    });
  } else {
    newSession();
  }
};

// .then(() => {
//   Promise.resolve(models.Users.getAll()).then((users) => {
//     console.log(users);
//   });
// });



/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

