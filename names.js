const async = require('async');
const {MongoClient, ObjectId} = require('mongodb');
const BSON = require('bson');

require('dotenv').load();

let lastId;

const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:27017/nosql`;

(async () => {
	const db = await MongoClient.connect(MONGO_URL);

	const Names = db.collection('names');

	const fs = require('fs');
	const ws = fs.createWriteStream('names_array.bson');

	let i = 0;

	async.doWhilst(
		cb => {
			const q = (() => {
				if (lastId) {
					return { _id: { $gt: lastId } };
				}
				return {};
			})();
			Names.find(q).sort({ _id: 1 }).limit(1000).toArray((err, names) => {
				if (err) return cb(err);
				if (!names.length) return cb(null, []);
				lastId = names[names.length - 1]._id;

				names.forEach(name => {
                    name._id = { '$oid': name._id.toString() }; // remains the same
                    
                    // rename nconst -> imdbID
                    name.imdbID = name.nconst;
                    delete name.nconst;

                    name.deathYear = name.deathYear === '\\N' ? undefined : name.deathYear;					
                    name.primaryProfession = name.primaryProfession === '\\N' ? [] : (name.primaryProfession || '').split(',');
                    name.knownForTitles = name.knownForTitles === '\\N' ? [] : (name.knownForTitles || '').split(',');
					ws.write(JSON.stringify(name) + '\n');
				});

				cb(null, names);
			});
		},
		names => {
			i += names.length;
			console.log(i);
			return names.length;
		},
		(err) => {
			if (err) {
				console.error(err);
			}
			console.log('done');

			ws.end();
			process.exit(0);
		}
	)
})();

