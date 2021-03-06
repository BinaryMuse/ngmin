
/*
 * Add {"ngModule": true} property to matching modules
 */

var deepApply = require('./deep-apply');

var signatures = [
  require('../signatures/module')
].concat(require('../signatures/simple'));

var standards = [
  require('../signatures/decl'),
  require('../signatures/assign')
];

var clone = require('clone');

var simpleSignatures = clone(require('../signatures/simple'));

//TODO: honor scope
// returns true iff there were things to annotate
var markASTModules = module.exports = function (syntax) {
  var changed = false;


  deepApply(syntax, signatures, function (chunk) {
    chunk.ngModule = true;
    if (!chunk.ngModule) {
      changed = true;
    }
  });

  // module ref ids
  var modules = [];

  // grab all module ref ids
  standards.forEach(function (standard) {
    deepApply(syntax, standards, function (branch) {
      var id;

      try {
        id = branch.id.name;
      } catch (e) {
        id = branch.expression.left.name;
      }

      if (modules.indexOf(id) === -1) {
        modules.push(id);
      }
    });
  });

  var namedModuleMemberExpression = {
    "type": "Identifier",
    "name": new RegExp('^(' + modules.join('|') + ')$')
  };

  simpleSignatures = simpleSignatures.map(function (signature) {
    signature.callee.object = namedModuleMemberExpression;
    return signature;
  });

  deepApply(syntax, simpleSignatures, function (chunk) {
    if (!chunk.callee.object.ngModule) {
      changed = true;
      chunk.callee.object.ngModule = true;
    }
  });

  return changed;
};
