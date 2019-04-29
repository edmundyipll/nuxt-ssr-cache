exports.cleanIfNewVersion = function(cache, version) {
    if (!version) return;
    return cache.get('appVersion')
        .then(function (oldVersion) {
            if (oldVersion !== version) {
                return cache.reset();
                // unfortunately multi cache doesn't return a promise
                // and we can't await for it so as to store new version
                // immediately after reset.
            }
        });
};

exports.tryStoreVersion = function(cache, version) {
    if (!version || cache.versionSaved) return;
    return cache.set('appVersion', version, {ttl: null})
        .then(function () {
            cache.versionSaved = true;
        });
};

exports.preprocessCacheKey = function(config, input, context) {
    if(config.cache.preprocessKey && config.cache.preprocessKey instanceof Function) {
        return config.cache.preprocessKey(input, context);
    }
    return input;
};

exports.callBeforeSetCacheHook = async function(config, result) {
    if(config.cache.beforeSetCache && config.cache.beforeSetCache instanceof Function) {
        await config.cache.beforeSetCache(result);
    }
};

exports.isCacheFriendly = function(config, path) {
    return config.cache.pages.some(
        pat => pat instanceof RegExp
            ? pat.test(path)
            : path.startsWith(pat)
    );
};

exports.isConfigValid = function(config) {
    return config.cache && Array.isArray(config.cache.pages) && config.cache.pages.length;
};

