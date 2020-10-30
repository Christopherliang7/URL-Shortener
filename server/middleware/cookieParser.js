const parseCookies = (req, res, next) => {
  //console.log(req.body);
  req.cookies = {};
  next(null, req, null);
};

module.exports = parseCookies;