/**
 * Module dependencies
 */
var _ = require('lodash');
var anchor = require('anchor');
var util = require('util');


/**
 * Mixes in `req.validate`.
 *
 * @param  {Request} req
 * @param  {Response} res
 * @return {Request}
 */
module.exports = function (req, res) {
  req.validate = _validate;

  /**
   * req.validate()
   *
   * @param  {Object} usage
   *         (supports either `{type: {}}` or `{}`)
   *
   * @param  {String} redirectTo
   *         (optional)
   *
   * @throws {Error}
   * @api public
   */

  function _validate (usage, redirectTo) {
    usage = usage || {};

    // Wrap `usage` in a `type` key, since req.params.all()
    // always returns an object anyways.
    // var invalidParams = anchor(req.params.all()).to({type: usage});
    var params = req.params.all();

    var err, errors = _.reduce(usage, function (errors, ruleset, key) {
      if (params[key] || ruleset.required) {
        err = anchor(params[key]).to(ruleset);
        err && (errors[key] = err);
      }
      return errors;
    }, {});

    if (!_.isEmpty(errors)) {

      var e = new E_INVALID_PARAMS({
        invalidParams: errors,
        route: req.url,
        method: req.method,
        usage: usage
      });

      if (redirectTo) {
        req.flash('error', e);
        res.redirect(redirectTo);
      }
      else {
        throw e;
      }
    }
  }

  return req;
};






/**
 * Constructs an E_INVALID_PARAMS error.
 * @constructor
 */
function E_INVALID_PARAMS (opts) {
  this.invalidParams = opts.invalidParams;
  this.route = opts.route;
  this.method = opts.method;
  this.usage = opts.usage;

  // Generate stack trace
  var e = new Error();
  this.stack = e.stack;
}
E_INVALID_PARAMS.prototype.code = 'E_INVALID_PARAMS';
E_INVALID_PARAMS.prototype.status = 400;

/**
 * How this error is serialized when sent w/ `res.json()`
 * @return {Object}
 */
E_INVALID_PARAMS.prototype.toJSON = function () {
  return {
    error: this.code,
    status: this.status,
    route: this.route,
    method: this.method,
    usage: this.usage,
    invalidParams: this.invalidParams
  };
};

/**
 * How this error appears when logged
 * (or whenever util.inspect is called on it)
 * @return {String}
 */
E_INVALID_PARAMS.prototype.inspect = function () {
  var output = 'Invalid parameters sent to route: "'+this.method + ' ' + this.route+'"';
  output += '\n';
  output += _.map(this.invalidParams, function (invalidParam) {
    return '  -> ' + invalidParam.message;
  });
  return output;
};
