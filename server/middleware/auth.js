const models = require('../models');
const Promise = require('bluebird');
const hash = require('../lib/hashUtils');

module.exports.createSession = (req, res, next) => {
  var newSession = () => {
    Promise.resolve(models.Sessions.create())
      .then(links => {
        Promise.resolve(models.Sessions.getAll()).then((data) => {
          res.cookies = {shortlyid: {value: ''}};
          req.session = {hash: data[data.length - 1].hash,
            user: {username: ''}};
          next();
        });
      });
  };
  if (req.cookies.shortlyid) {
    Promise.resolve(models.Sessions.get({hash: req.cookies.shortlyid})).then((data) => {
      if (data) {
        res.cookies = {shortlyid: {value: ''}};
        req.session = {hash: data.hash,
          user: {username: data.user.username}, userId: data.id};
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





/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

