const {serialize, deserialize} = require('./serializer');
const makeCache = require('./cache-builders');
const {cleanIfNewVersion, tryStoreVersion, isCacheFriendly, preprocessCacheKey, isConfigValid} = require('./util');

module.exports = function cacheRenderer(nuxt, config) {
    // used as a nuxt module, only config is provided as argument
    // and nuxt instance will be provided as this context
    if (arguments.length < 2 && this.nuxt) {
      nuxt = this.nuxt;
      config = this.options;
    }

    if (!isConfigValid(config)) {
        return;
    }

    const currentVersion = config.version || config.cache.version;
    const cache = makeCache(config.cache.store);
    cleanIfNewVersion(cache, currentVersion);

    const renderer = nuxt.renderer;
    const renderRoute = renderer.renderRoute.bind(renderer);
    renderer.renderRoute = function(route, context) {
        // hopefully cache reset is finished up to this point.
        tryStoreVersion(cache, currentVersion);


        if (!isCacheFriendly(config, route)) {
            return renderRoute(route, context);
        }

        function renderSetCache(){
            return renderRoute(route, context)
                .then(function(result) {
                    if (!result.error) {
                        cache.set(preprocessCacheKey(config, route, context), serialize(result));
                    }
                    return result;
                });
        }

        return cache.get(preprocessCacheKey(config, route, context))
            .then(function (cachedResult) {
                if (cachedResult) {
                    return deserialize(cachedResult);
                }

                return renderSetCache();
            })
            .catch(renderSetCache);
    };

    return cache;
};
