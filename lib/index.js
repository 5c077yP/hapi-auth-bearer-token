var Boom = require('boom');
var Hoek = require('hoek');

exports.register = function (plugin, options, next) {

    plugin.auth.scheme('bearer-access-token', function (server, options) {

        Hoek.assert(options, 'Missing bearer auth strategy options');
        Hoek.assert(typeof options.validateFunc === 'function', 'options.validateFunc must be a valid function in bearer scheme');

        var settings = Hoek.clone(options);

        var scheme = {
            authenticate: function (request, reply) {

                var req = request.raw.req;
                var authorization = req.headers.authorization;

                if(!authorization && request.query.access_token){
                    authorization = "Bearer " + request.query.access_token;
                    delete request.query.access_token
                }

                if (!authorization) {
                    return reply(Boom.unauthorized(null, 'Bearer'));
                }

                var parts = authorization.split(/\s+/);

                if (parts[0].toLowerCase() !== 'bearer') {
                    return reply(Boom.unauthorized(null, 'Bearer'));
                }

                if (parts.length !== 2 || parts[1].length < 1) {
                    return reply(Boom.badRequest('Bad HTTP authentication header format', 'Bearer'));
                }

                var token = parts[1];

                settings.validateFunc(token, function (err, isValid, credentials) {

                    if (err) {
                        return reply(err, { credentials: credentials, log: { tags: ['auth', 'bearer'], data: err } });
                    }

                    if (!isValid) {
                        return reply(Boom.unauthorized('Bad token', 'Bearer'), { credentials: credentials });
                    }

                    if (!credentials || typeof credentials !== 'object') {
                        return reply(Boom.badImplementation('Bad token string received for Bearer auth validation'), { log: { tags: 'token' } });
                    }

                    // Authenticated (must contain object with credentials property)
                    return reply(null, { credentials: credentials });
                });
            }
        };

        return scheme;
    });

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};




