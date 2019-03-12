const {deserialize} = require('./serializer');
const makeCache = require('./cache-builders');
const {cleanIfNewVersion, tryStoreVersion, isCacheFriendly, preprocessCacheKey, isConfigValid} = require('./util');

module.exports = function getMiddleware(config) {
    if(!isConfigValid(config)) {
        return function(req, res, next){
            return next();
        }
    }
    const currentVersion = config.version || config.cache.version;
    const cache = makeCache(config.cache.store);
    cleanIfNewVersion(cache, currentVersion);

    return function(req, res, next) {
        // hopefully cache reset is finished up to this point.
        tryStoreVersion(cache, currentVersion);

        if (!isCacheFriendly(config, req.originalUrl)) {
            return next();
        }

        return cache.get(preprocessCacheKey(config, req.originalUrl, {req, res}))
            .then(function (cachedResult) {
                if (cachedResult) {
                    let obj = deserialize(cachedResult);
                    if(obj && obj.html) {
                        return res.send(obj.html);
                    }
                }
                return next();
            }).catch(function () {
                return next();
            })
    }
}

