var debug = require('debug')('connect:redis');

/**
 * One day in seconds.
 */
var oneDay = 86400;

/*
 * JSON Serializer for RedisStore
 */
var JSONSerializer = function(store) {
    
    /*
     * The RedisStore
     */
    this.store = store;
};

JSONSerializer.prototype.save = function(sid, sess, fn) {
    sid = this.store.prefix + sid;
    try {
      var maxAge = sess.cookie.maxAge
        , ttl = this.store.ttl
        , sess = JSON.stringify(sess);

      ttl = ttl || ('number' == typeof maxAge
          ? maxAge / 1000 | 0
          : oneDay);

      debug('SETEX "%s" ttl:%s %s', sid, ttl, sess);
      this.store.client.setex(sid, ttl, sess, function(err){
        err || debug('SETEX complete');
        fn && fn.apply(this, arguments);
      });
    } catch (err) {
      fn && fn(err);
    } 
}

JSONSerializer.prototype.load = function(sid, fn) {
    sid = this.store.prefix + sid;
    debug('GET "%s"', sid);
    this.store.client.get(sid, function(err, data){
      if (err) return fn(err);
      if (!data) return fn();
      var result;
      data = data.toString();
      debug('GOT %s', data);
      try {
        result = JSON.parse(data); 
      } catch (err) {
        return fn(err);
      }
      return fn(null, result);
    });
}

JSONSerializer.prototype.delete = function(sid, fn) {
    sid = this.store.prefix + sid;
    this.store.client.del(sid, fn);
}

module.exports = JSONSerializer;