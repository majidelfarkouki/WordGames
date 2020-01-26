let mkdirp = require('mkdirp');

var cache_directory = process.env.CACHE_DIRECTORY;
cache_directory = cache_directory.replace('~', require('os').homedir());

function createCacheTree(cache_directory, callback) {
    mkdirp(cache_directory + '/a', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/b', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/c', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/d', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/e', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/f', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/g', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/h', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/i', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/j', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/k', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/l', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/m', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/n', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/o', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/p', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/q', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/r', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/s', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/t', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/u', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/v', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/w', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/x', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/y', function(err) {
        if(err) process.stderr.write('Error : ' + err); 
    });
    mkdirp(cache_directory + '/z', function(err) {
        if(err) process.stderr.write('Error : ' + err);
    });
    mkdirp(cache_directory + '/special', function(err) {
        if(err) process.stderr.write('Error : ' + err);
    });

    return callback();
}

createCacheTree(cache_directory, function() {
    console.log('Done');
})