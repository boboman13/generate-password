'use strict';

var crypto = require('crypto');

var self = module.exports;

// Generates a random number
var randomNumber = function(max) {
// gives a number between 0 (inclusive) and max (exclusive)
	return crypto.randomBytes(1)[0] % max;
};

// Possible combinations
var lowercase = 'abcdefghijklmnopqrstuvwxyz',
	numbers = '0123456789',
	similarCharacters = /[ilLI|`oO0]/g,
	strictRules = [
		{ name : 'lowercase', rule : /[a-z]/ },
		{ name : 'uppercase', rule : /[A-Z]/ },
		{ name : 'numbers', rule : /[0-9]/ },
		{ name : 'symbols', rule : /[!|@#\$%\^&\*\(\)\+_\-=}\{\[]|\||:|;|'|\/|\?|\.|>|<|,|`|~]/ }
	],
	symbols = '!@#$%^&*()+_-=}{[]|:;\'/?.><,`~',
	uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var generate = function(options, pool){
	var optionsLength = options.length,
		password = '',
		poolLength = pool.length;

	for (var i = 0; i < optionsLength; i++) {
		password += pool[randomNumber(poolLength)];
	}

	return password;
};

var reGenerate = function(password, options, pool){
	var result = password,
		rulesApply = true;

	rulesApply = strictRules.reduce(function(result, rule){
		if (options[rule.name]){
			result = result && rule.rule.test(password);
		}
		return result;
	}, rulesApply);

	if (!rulesApply){
		result = generate(options, pool);
	}

	return result;
};

var trampoline = function(f){
	while (f && f instanceof Function){
		f = f.apply(f.context, f.args);
	}
	return f;
};

var thunk = function(fn){
	return function(){
		var args = Array.prototype.slice.apply(arguments);
		return function(){ return fn.apply(this, args); };
	};
};

// Generate a random password.
self.generate = function(options) {
// Set defaults.
	if (!options.hasOwnProperty('length')) { options.length = 10; }
	if (!options.hasOwnProperty('lowercase')) { options.lowercase = true; }
	if (!options.hasOwnProperty('numbers')) { options.numbers = false; }
	if (!options.hasOwnProperty('symbols')) { options.symbols = false; }
	if (!options.hasOwnProperty('uppercase')) { options.uppercase = true; }
	if (!options.hasOwnProperty('excludeSimilarCharacters')) { options.excludeSimilarCharacters = false; }
	if (!options.hasOwnProperty('strict')) { options.strict = false; }

	if (options.strict){
		var minStrictLength = 1 + (options.numbers ? 1 : 0) + (options.symbols ? 1 : 0) + (options.uppercase ? 1 : 0);
		if (minStrictLength > options.length){
			throw (new Error('Length should correlate with strict guidelines'));
		}
	}

	// Generate character pool
	var pool = lowercase;

	// uppercase
	if (options.uppercase) {
		pool += uppercase;
	}
	// numbers
	if (options.numbers) {
		pool += numbers;
	}
	// symbols
	if (options.symbols) {
		pool += symbols;
	}
	// similar characters
	if (options.excludeSimilarCharacters) {
		pool = pool.replace(similarCharacters, '');
	}

	var password = generate(options, pool);

	if (options.strict){
		// Need to use trampoline to avoid edge case when regeneration fill's the stack
		password = trampoline(thunk(reGenerate)(password, options, pool));
	}

	return password;
};

// Generates multiple passwords at once with the same options.
self.generateMultiple = function(amount, options) {
	var passwords = [];

	for (var i = 0; i < amount; i++) {
		passwords[i] = self.generate(options);
	}

	return passwords;
};
