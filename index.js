const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
var magnet = require("magnet-uri");
var shell = require('shelljs');
const mysql = require('mysql');

var config =
{
    host: 'sql434.main-hosting.eu',
    user: 'u888071488_root',
    password: 'Ss161514',
    database: 'u888071488_stremio_db',
    port: 3306
};

const conn = new mysql.createConnection(config);

conn.connect(
    function (err) { 
    if (err) { 
        console.log("!!! Cannot connect !!! Error:");
        throw err;
    }
    else  {
       console.log("Connection established.");     
	   conn.query('SELECT * FROM preferidos', 
        function (err, results, fields) {
            if (err) throw err;            
            console.log(results);
        });	   
    }
});

/*
git add .
git commit -am "make it better"
git push heroku master
*/

const builder = new addonBuilder({
	id: 'stremiodubladoH',
	version: '1.0.8',
	name: 'DBH',
	catalogs: [		
		{
			type: 'series',
			id: 'dubladoH'
		}
	],
	resources: ["catalog", 'stream'],
	types: ['movie', 'series'],
	idPrefixes: ['tt']
});
builder.defineStreamHandler(async function(args) {

	var key = args.id.replace(':', ' ').replace(':', ' ');
	var dataset_temp = [];
	console.log(args);
	var reg = await getRegistros(key);
	reg.forEach((row) => {
		try {
			var converte = fromMagnetMap(row.magnet, row.mapa, row.nome);
			//console.log(converte);
			if (dataset_temp != null) {
				if (dataset_temp.indexOf(converte) > -1) {
					console.log("Existe:", row.nome);
				} else {
					//console.log("PUSH:", converte);
					dataset_temp.push(converte);
				}
			} else {
				dataset_temp = [converte];
			}
		} catch (e) {
			console.log(e);
		}
	});
	//console.log(dataset_temp.length);
	
	return Promise.resolve({ streams: dataset_temp });
});
const METAHUB_URL = "https://images.metahub.space"

builder.defineCatalogHandler(async function(args, cb) {
	console.log(args);
	var dataset_temp = [];

	var reg = await getCatalogo();
	reg.forEach((row) => {
		try {
			var imdbId = row.imdb.split(":")[0]
			var converte = {
				id: imdbId,
				type: args.type,
				name: row.nome,
				poster: METAHUB_URL + "/poster/medium/" + imdbId + "/img"
			}
			//console.log(converte);
			if (dataset_temp != null) {
				if (dataset_temp.indexOf(converte) > -1) {
					console.log("Existe:", row.imdb);
				} else {
					//console.log("PUSH:", converte);
					dataset_temp.push(converte);
				}
			} else {
				dataset_temp = [converte];
			}			

		} catch (e) {
			console.log(e);
		}
	});

	return Promise.resolve({ metas: dataset_temp });

})

async function getRegistros(key) {
	console.log(key)
	conn.query('SELECT * FROM registros where imdb="'+key+'"', 
        function (err, results, fields) {
            if (err) throw err;            
            return results;
        });	
}
async function getCatalogo() {
	//return client.db("registros").collection("preferidos").find({}).toArray();
	return [];
}
function fromMagnetMap(uri, m, nome) {
	//console.log(uri);
	var parsed = magnet.decode(uri);
	// console.log(uri);
	var infoHash = parsed.infoHash.toLowerCase();
	nome = nome.toUpperCase();

	var tags = "";
	if (nome.match(/720P/i))
		tags = tags + ("720p ");
	if (nome.match(/1080P/i))
		tags = tags + ("1080p ");
	if (nome.match(/LEGENDADO/i))
		tags = tags + ("LEGENDADO ");
	if (nome.match(/DUBLADO/i))
		tags = tags + ("DUBLADO ");
	if (nome.match(/DUBLADA/i))
		tags = tags + ("DUBLADA ");
	if (nome.match(/DUAL/i))
		tags = tags + ("DUAL ÁUDIO ");
	if (nome.match(/4K/i))
		tags = tags + ("4K ");
	if (nome.match(/2160P/i))
		tags = tags + ("2160p ");
	if (nome.match(/UHD/i))
		tags = tags + ("UHD ");
	if (nome.match(/HDCAM/i))
		tags = tags + ("HDCAM ");
	if (nome.match(/BLURAY/i))
		tags = tags + ("BLURAY ");
	if (nome.match(/HDTC/i))
		tags = tags + ("HDTC ");

	return {
		infoHash: infoHash,
		title: tags,
		fileIdx: m
	}
}

function fechar() {
	var pid = shell.exec('pidof -c node').stdout;
	var sp = pid.split(" ");
	for (var s in sp) {
		if (s > 3) {
			console.log('kill -9 ' + sp[s]);
			shell.exec('kill -9 ' + sp[s]);
		}
	};

}

var addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: process.env.PORT || 8080 });
//serveHTTP(addonInterface, { port: 5000});
