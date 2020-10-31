const parseCookies = (req, res, next) => {
  var cookie = req.headers.cookie;
  var cookieObj = {};
  if (cookie) {
    var cookies = cookie.split('; ');
    cookies.forEach((cookie) => {
      var cookieArr = cookie.split('=');
      cookieObj[cookieArr[0]] = cookieArr[1];
    });
  }
  req.cookies = cookieObj;
  next();
};

module.exports = parseCookies;
