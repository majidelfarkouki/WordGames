let iconv = require("iconv-lite");
var express = require("express");
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require("mkdirp");
var https = require('https');
var cors = require("cors");
var fs = require("fs");
var MongoClient = require("mongodb").MongoClient;

let term_cache_directorypath, infos_filepath, definitions_filepath, relationships_types_filepath, incoming_relationships_filepath, outgoing_relationships_filepath;
let cache_directory = process.env.CACHE_DIRECTORY.replace('~', require('os').homedir());

/**
 * @description Fonction qui vérifie si le terme est présent dans le cache et qui créé le cache s'il n'est pas existant.
 * Retourne null si le cache est prêt à être exploité, sinon retourne l'erreur survenue
 * 
 * @param {string} term_searched 
 * @param {{(error: Error) => void}} callback
 */
function loadTerm(term_searched, callback) {

    term_searched = term_searched.replace(/:/g, '_');

    // Déclaration des chemins d'accès au cache et au fichier de définition
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    infos_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/infos.json';
    definitions_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/definitons.json';
    relationships_types_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/types.json';
    outgoing_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/outgoings.json';
    incoming_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/incomings.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(infos_filepath, function (exists) {
        if (!exists) {
            // Cas du terme non répertorié dans le cache
            // On construit l'URL de requête au serveur jeuxdemots.org pour récupérer les infos au format XML      

            url_term = term_searched.replace(/\s/g, '+');
            url_term = escape(url_term);

            // url = "http://www.jeuxdemots.org/rezo-xml.php?gotermsubmit=Chercher&gotermrel=" + url_term + "&output=onlyxml";
            url = "http://www.jeuxdemots.org/rezo-dump.php?gotermsubmit=Chercher&gotermrel=" + url_term + "&rel=&output=onlyxml";
            process.stdout.write('\nURL searched: ' + url + '\n\n');

            // On appel la fonction de création de cache
            getRemoteDumpTerm(url, function (error) {
                // Une fois les fichiers de cache remplis, on le fait savoir
                if (error) return callback(error);
                else return callback(null);
            });
        } else {
            // Cas où le term est déjà répertorié dans le cache, on le fait savoir
            return callback(null);
        }
    });
}

/**
 * @description Cette fonction récupère les infos (poids, id) liées au terme dans le cache et les retourne en un string au format JSON
 * @param {string} term_searched 
 * @param {{(error: any, data_json: string) => void}} callback - Retourne une erreur (vide s'il n'y en a pas) et JSON au format string
 */
function getTermInfos(term_searched, callback) {

    // Déclaration des chemins d'accès au cache et au fichier de relations entrantes
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    infos_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/infos.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(term_cache_directorypath, function (exists) {
        // Cas du terme non répertorié dans le cache
        if (!exists) {
            return callback('Error : ' + infos_filepath + ' does not exist!', null);
        } else {
            // Cas du terme déjà répertorié dans le cache
            var infos_json = require(infos_filepath);
            return callback(null, JSON.stringify(infos_json));
        }
    });
}

/**
 * @description Cette fonction récupère les définitions liées au terme dans le cache et les retourne en un string au format JSON
 * @param {string} term_searched 
 * @param {{(error: any, data_json: string) => void}} callback - Retourne une erreur (vide s'il n'y en a pas) et JSON au format string
 * @returns {string}
 */
function getTermDefinitions(term_searched, callback) {

    // Déclaration des chemins d'accès au cache et au fichier de définition
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    definitions_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/definitons.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(definitions_filepath, function (exists) {
        // Cas du terme non répertorié dans le cache
        if (!exists) {
            return callback(null, JSON.stringify([{
                def: 'Aucune définition'
            }]));
            // return callback('Error : ' + infos_filepath + ' does not exist!', null);
        } else {
            // Cas du terme déjà répertorié dans le cache
            var definitions_json = require(definitions_filepath);
            return callback(null, JSON.stringify(definitions_json));
        }
    });
}

/**
 * @description Cette fonction récupère les relations sortantes liées au terme dans le cache et les retourne en un string au format JSON
 * @param {string} term_searched 
 * @param {{(error: any, data_json: string) => void}} callback - Retourne une erreur (vide s'il n'y en a pas) et JSON au format string
 */
function getTermRelationshipsTypes(term_searched, callback) {

    // Déclaration des chemins d'accès au cache et au fichier de relations entrantes
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    relationships_types_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/types.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(relationships_types_filepath, function (exists) {
        // Cas du terme non répertorié dans le cache
        if (!exists) {
            return callback(null, JSON.stringify([{
                id: 0,
                name: '',
                description: ''
            }]));
        } else {
            var relationships_types_json = require(relationships_types_filepath);
            return callback(null, JSON.stringify(relationships_types_json));
        }
    });
}

/**
 * @description Cette fonction récupère les relations entrantes liées au terme dans le cache et les retourne en un string au format JSON
 * @param {string} term_searched 
 * @param {{(error: any, data_json: string) => void}} callback - Retourne une erreur (vide s'il n'y en a pas) et JSON au format string
 */
function getTermIncomingsRelationships(term_searched, callback) {

    // Déclaration des chemins d'accès au cache et au fichier de relations entrantes
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    incoming_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/incomings.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(incoming_relationships_filepath, function (exists) {
        // Cas du terme non répertorié dans le cache
        if (!exists) {
            return callback(null, JSON.stringify([{
                term: 'Aucune relation entrante',
                weight: 0,
                type: null
            }]));
            // return callback('Error : ' + incoming_relationships_filepath + ' does not exist!', null);
        } else {
            var incomings_json = require(incoming_relationships_filepath);
            return callback(null, JSON.stringify(incomings_json));
        }
    });
}

/**
 * @description Cette fonction récupère les relations sortantes liées au terme dans le cache et les retourne en un string au format JSON
 * @param {string} term_searched 
 * @param {{(error: any, data_json: string) => void}} callback - Retourne une erreur (vide s'il n'y en a pas) et JSON au format string
 */
function getTermOutgoingsRelationships(term_searched, callback) {

    // Déclaration des chemins d'accès au cache et au fichier de relations entrantes
    term_cache_directorypath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched;
    outgoings_relationships_filepath = cache_directory + '/' + getDirectory(term_searched) + '/' + term_searched + '/outgoings.json';

    // Vérification de l'existance du terme dans le cache
    fs.exists(outgoings_relationships_filepath, function (exists) {
        // Cas du terme non répertorié dans le cache
        if (!exists) {
            return callback(null, JSON.stringify([{
                term: 'Aucune relation sortante',
                weight: 0,
                type: null
            }]));
            // return callback('Error : ' + outgoings_relationships_filepath + ' does not exist!', null);
        } else {
            var outgoings_json = require(outgoings_relationships_filepath);
            return callback(null, JSON.stringify(outgoings_json));
        }
    });
}

/**
 * Fonction qui récupère la page XML du serveur jeuxdemots.org puis la parse et créer les fichiers de cache
 * 
 * @param {string} url 
 * @param {{(error: Error) => void}} callback 
 */
function getRemoteXMLTerm(url, callback) {
    options = {
        uri: url,
        encoding: null
    };
    request(options, function (err, resp, html) {
        if (!err) {
            process.stdout.write('Page scrapped');
            var body = iconv.decode(html, "ISO-8859-1");
            $ = cheerio.load(body, {
                decodeEntities: false
            });
            error = $(".jdm-warning").html();

            if (error) {
                return callback("Term does not exist");
            } else {
                mkdirp(term_cache_directorypath, (err) => {
                    if (err) return callback(err);
                });
            }

            // Récupération des infos        
            infos = $('mot');
            mot = infos.html();
            poids = infos.attr('poids');
            identifiant = infos.attr('id');
            content = {
                word: mot,
                id: identifiant,
                weight: poids
            };
            // Sauvegarde des infos
            saveInCache(infos_filepath, content, (err, data) => {
                if (err) return callback(err);
                else process.stdout.write(data);
            });

            // Récupération des définitions
            def_list = [];
            definitions = $('def').html();
            definitions = definitions.replace(/\n(\d\.\s)/g, '#@#');
            def_list = definitions.split('#@#');
            if (def_list.length > 0) {
                definitions = [];
                def_list.forEach(element => {
                    definitions.push({
                        def: element
                    });
                });
                definitions.shift();
            } else {
                definitions = [{
                    def: 'Aucune définition'
                }];
            }
            // Sauvegarde des définitions
            saveInCache(definitions_filepath, definitions, (err, data) => {
                if (err) return callback(err);
                else process.stdout.write(data);
            });

            // Récupération des relations entrantes
            incomings = [];
            if ($('entrant').html() != null) {
                $in = cheerio.load($('entrant').html(), {
                    decodeEntities: false
                });
                $incomings_list = $in('rel').each(function (index) {
                    if (!$in(this).attr('te')) {
                        incomings.push({
                            id: $in(this).attr('tid'),
                            type: $in(this).attr('type'),
                            weight: $in(this).attr('poids'),
                            term: $in(this).html()
                        });
                    }
                });
            } else {
                incomings = [{
                    id: 0,
                    type: '',
                    weight: 0,
                    term: 'Aucune relation entrante'
                }];
            }
            // Sauvegarde des relations entrantes
            saveInCache(incoming_relationships_filepath, incomings, (err, data) => {
                if (err) return callback(err);
                else process.stdout.write(data);
            });

            // Récupération des relations sortantes
            outgoings = [];
            if ($('sortant').html() != null) {
                $out = cheerio.load($('sortant').html(), {
                    decodeEntities: false
                });
                $outgoings_list = $out('rel').each(function (index) {
                    if (!$out(this).attr('te')) {
                        outgoings.push({
                            id: $out(this).attr('tid'),
                            type: $out(this).attr('type'),
                            weight: $out(this).attr('poids'),
                            term: $out(this).html()
                        });
                    }
                });
            } else {
                outgoings = [{
                    id: 0,
                    type: '',
                    weight: 0,
                    term: 'Aucune relation sortante'
                }];
            }
            // Sauvegarde des relations sortantes
            process.stdout.write('Saving...');
            saveInCache(outgoing_relationships_filepath, outgoings, (err, data) => {
                if (err) return callback(err);
                else {
                    process.stdout.write(data);
                    return callback(null);
                }
            });
        }
    });
}

/**
 * Fonction qui récupère la page DUMP du serveur jeuxdemots.org puis la parse et créer les fichiers de cache
 * 
 * @param {string} url 
 * @param {{(error: Error) => void}} callback 
 */
function getRemoteDumpTerm(url, callback) {
    options = {
        uri: url,
        encoding: null
    };
    request(options, function (err, resp, html) {
        if (!err) {
            var body = iconv.decode(html, "ISO-8859-1");

            // Création de balises pour délimiter les parties du fichier récupéré pour faciliter le parcours
            body = body.replace("// les types de noeuds (Nodes Types) : nt;ntid;'ntname'", "<types_noeuds>");
            body = body.replace("// les noeuds/termes (Entries) : e;eid;'name';type;w;'formated name' ", "</types_noeuds><entrees>");
            body = body.replace("// les types de relations (Relation Types) : rt;rtid;'trname';'trgpname';'rthelp' ", "</entrees><types_relations>");
            body = body.replace("// les relations sortantes : r;rid;node1;node2;type;w ", "</types_relations><sortants>");
            body = body.replace("// les relations entrantes : r;rid;node1;node2;type;w ", "</sortants><entrants>");
            body = body.replace("// END", "</entrants>");
            $ = cheerio.load(body, {
                decodeEntities: false
            });

            // Si une balise avec la classe jdm-warning existe on lève l'erreur indiquant que le terme n'existe pas
            error = $(".jdm-warning").html();
            if (error) {
                return callback("Term does not exist");
            } else {
                mkdirp(term_cache_directorypath, (err) => {
                    if (err) return callback(err);
                    else {
                        // Récupération des définitions
                        def_list = [];
                        definitions = $('def').html();
                        if (definitions) {
                            // Découpage des définitions
                            definitions = definitions.replace(/\n(\d\.\s)/g, '#@#');
                            def_list = definitions.split('#@#');
                            if (def_list.length > 0) {
                                if(def_list.length === 1)
                                    def_list[0] = def_list[0].replace(/\n<br>\n/, '');
                                definitions = [];
                                def_list.forEach(element => {
                                    definitions.push({
                                        def: element
                                    });
                                });
                                if (def_list.length > 1)
                                    definitions.shift();
                            } else {
                                definitions = [{
                                    def: 'Aucune définition'
                                }];
                            }
                        } else {
                            definitions = [{
                                def: 'Aucune définition'
                            }];
                        }
                        // Sauvegarde des définitions
                        saveInCache(definitions_filepath, definitions, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Récupération des termes liés (entries)
                        entries = [];
                        var termes = $('entrees').html();
                        if (termes) {
                            // Découpage et récupération de toutes les entrées/termes qui sont présents dans les relations (sortantes et entrantes)
                            entries_list = termes.split(/\n/);
                            entries_list.shift(); // Suppression des ékéments vides du tableau
                            entries_list.shift();
                            infos = entries_list.shift(); // Récupération des infos liés au terme recherché
                            entries_list.pop(); // Suppression des ékéments vides du tableau
                            entries_list.pop();
                            entries_list.forEach((value, index) => {
                                // Construction de l'objet JSON contenant les entrées/termes entries[id_terme] = terme
                                elements = value.split(';');
                                if (elements[2]) {
                                    if (elements.length === 5) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        entries[elements[1]] = elements[2];
                                    } else {
                                        // Cas où le terme formaté est présent, on l'utilise car plus explicite
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        entries[elements[1]] = elements[5];
                                    }
                                }
                            });
                        }

                        // Récupération des infos
                        if (termes) {
                            infos = infos.split(';');
                            mot = infos[2];
                            poids = infos[4];
                            identifiant = infos[1];
                            content = {
                                word: mot,
                                id: identifiant,
                                weight: poids
                            };
                        } else {
                            content = {
                                word: term,
                                id: 0,
                                weight: 0
                            };
                        }
                        // Sauvegarde des infos
                        saveInCache(infos_filepath, content, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Récupération des types de relations
                        relationships_types = [];
                        relationships_types_json = [];
                        var types_relations = $('types_relations').html();
                        if (types_relations) {
                            // Découpage et prépartion des différents types de relations liés à ce terme
                            relationships_types_list = types_relations.split(/\n/);
                            relationships_types_list.shift();
                            relationships_types_list.shift();
                            relationships_types_list.pop();
                            relationships_types_list.pop();
                            relationships_types_list.forEach((value, index) => {
                                // Construction de l'objet JSON contenant les types relations liés au terme recherché
                                elements = value.split(';');
                                if (elements[2]) {
                                    elements[2] = elements[2].replace(/^'/g, "");
                                    elements[2] = elements[2].replace(/'$/g, "");
                                    if (elements.length === 4)
                                        relationships_types_json.push({
                                            id: elements[1],
                                            name: elements[2],
                                            description: elements[3]
                                        });
                                    else
                                        // Cas où il y a un groupe name du type
                                        relationships_types_json.push({
                                            id: elements[1],
                                            name: elements[2],
                                            description: elements[4]
                                        });
                                    relationships_types[elements[1]] = elements[2];
                                }
                            });
                        }
                        // Sauvegarde des types de relations
                        saveInCache(relationships_types_filepath, relationships_types_json, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Récupération des relations sortantes            
                        outgoings = [];
                        var sortants = $('sortants').html();
                        if (sortants) {
                            // Découpage et préparation des relations sortantes
                            outgoings_list = sortants.split(/\n/);
                            outgoings_list.shift(); // Suppression des ékéments vides du tableau
                            outgoings_list.shift();
                            outgoings_list.pop(); // Suppression des ékéments vides du tableau
                            outgoings_list.pop();
                            outgoings_list.forEach((value, index) => {
                                // Construction de l'objet JSON contenant les relations sortantes
                                elements = value.split(';');
                                if (elements[2]) {
                                    // Cas où le terme cherché est le noeud 2
                                    if (elements[2] !== identifiant) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        outgoings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[2]]
                                        });
                                    } else {
                                        // Cas où le terme recherché est le noeud 1
                                        elements[3] = elements[3].replace(/^'/g, "");
                                        elements[3] = elements[3].replace(/'$/g, "");
                                        outgoings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[3]]
                                        });
                                    }
                                }
                            });
                        } else {
                            outgoings = [{
                                id: 0,
                                type: '',
                                weight: 0,
                                term: 'Aucune relation sortante'
                            }];
                        }
                        // Sauvegarde des relations sortantes
                        saveInCache(outgoing_relationships_filepath, outgoings, (err, data) => {
                            if (err) return callback(err);
                            else console.log(data);
                        });

                        // Récupération des relations entrantes            
                        incomings = [];
                        var entrants = $('entrants').html();
                        if (entrants) {
                            // Découpage et préparation des relations entrantes
                            incomings_list = entrants.split(/\n/);
                            incomings_list.shift(); // Suppression des ékéments vides du tableau
                            incomings_list.shift();
                            incomings_list.pop(); // Suppression des ékéments vides du tableau
                            incomings_list.pop();
                            incomings_list.forEach((value, index) => {
                                // Construction de l'objet JSON contenant les relations entrantes
                                elements = value.split(';');
                                if (elements[2]) {
                                    // Cas où le terme cherché est le noeud 2
                                    if (elements[2] !== identifiant) {
                                        elements[2] = elements[2].replace(/^'/g, "");
                                        elements[2] = elements[2].replace(/'$/g, "");
                                        incomings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[2]]
                                        });
                                    } else {
                                        // Cas où le terme cherché est le noeud 1
                                        elements[3] = elements[3].replace(/^'/g, "");
                                        elements[3] = elements[3].replace(/'$/g, "");
                                        incomings.push({
                                            id: elements[1],
                                            type: relationships_types[elements[4]],
                                            weight: elements[5],
                                            term: entries[elements[3]]
                                        });
                                    }
                                }
                            });
                        } else {
                            incomings = [{
                                id: 0,
                                type: '',
                                weight: 0,
                                term: 'Aucune relation entrante'
                            }];
                        }
                        // Sauvegarde des relations entrantes
                        saveInCache(incoming_relationships_filepath, incomings, (err, data) => {
                            if (err) return callback(err);
                            else {
                                console.log(data);
                                return callback(null);
                            }
                        });
                    }
                });
            }


        }
    });
}

/**
 * Fonction qui sauvegarde dans un fichier json le contenu passé
 *
 * @param {sting} filepath - Chemin du fichier à enregistrer
 * @param {JSON} content - A JSON object
 * @param {{(error: object) => void} callback - Return an error
 */
function saveInCache(filepath, content, callback) {
    fs.writeFile(filepath, JSON.stringify(content), 'UTF-8', (err) => {
        if (err) return callback(err, null);
        else {
            process.stdout.write(filepath + ' saved');
            return callback(null, filepath + ' saved');
        }
    });
}

function getAutoCompl(characters, callback) {
    // MongoClient.connect("mongodb://site.martin-abadie.fr/jdm", function(error, client) {
    // MongoClient.connect("mongodb://localhost/jdm", function(error, client) {
    MongoClient.connect(process.env.MONGO_DB_URL, function (error, client) {
        if (error) {
            console.error(error);
            return;
        }

        var collection = 'words_';
        var first_character = characters.charAt(0).toLowerCase();

        if (first_character === 'a' || first_character === 'à' || first_character === 'â') {
            collection += 'a';
        } else if (first_character === 'e' || first_character === 'é' || first_character === 'è' || first_character === 'ê' || first_character === 'ë') {
            collection += 'e';
        } else if (first_character === 'i' || first_character === 'î' || first_character === 'ï') {
            collection += 'i';
        } else if (first_character === 'o' || first_character === 'ô' || first_character === 'ö') {
            collection += 'o';
        } else if (first_character === 'u' || first_character === 'û' || first_character === 'ù' || first_character === 'ü') {
            collection += 'u';
        } else {
            collection += first_character;
        }

        var re = new RegExp("\^" + characters);
        terms = client.db('jdm').collection(collection).find({
            word: re
        }).sort({
            weight: -1
        }).limit(5).toArray((err, docs) => {
            return callback(docs);
        });
    });
}

/**
 * Fonction qui retourne la lettre du répertoire où doit se trouver le cahce du terme
 * 
 * @example getDirectory('école') => 'e'
 * @param {string} term 
 */
function getDirectory(term) {
    var fstChar = term.charAt(0).toLowerCase();

    if (fstChar === 'a' || fstChar === 'à' || fstChar === 'â') {
        return 'a';
    } else if (fstChar === 'e' || fstChar === 'é' || fstChar === 'è' || fstChar === 'ê' || fstChar === 'ë') {
        return 'e';
    } else if (fstChar === 'i' || fstChar === 'î' || fstChar === 'ï') {
        return 'i';
    } else if (fstChar === 'o' || fstChar === 'ô' || fstChar === 'ö') {
        return 'o';
    } else if (fstChar === 'u' || fstChar === 'û' || fstChar === 'ù' || fstChar === 'ü') {
        return 'u';
    } else if (fstChar === '_' || fstChar === '=') {
        return 'special';
    } else {
        return fstChar;
    }
}

module.exports.getAutoCompl = getAutoCompl;
module.exports.loadTerm = loadTerm;
module.exports.getTermInfos = getTermInfos;
module.exports.getTermDefinitions = getTermDefinitions;
module.exports.getTermRelationshipsTypes = getTermRelationshipsTypes;
module.exports.getTermIncomingsRelationships = getTermIncomingsRelationships;
module.exports.getTermOutgoingsRelationships = getTermOutgoingsRelationships;