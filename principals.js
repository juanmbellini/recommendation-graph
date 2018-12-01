const async = require('async');
const {MongoClient, ObjectId} = require('mongodb');
const BSON = require('bson');

require('dotenv').load();

let lastId;

const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:27017/nosql`;

(async () => {
	const db = await MongoClient.connect(MONGO_URL);

	const Principal = db.collection('principals');

	const fs = require('fs');
	const ws = fs.createWriteStream('principals_array.bson');

	let i = 0;

	async.doWhilst(
		cb => {
			const q = (() => {
				if (lastId) {
					return { _id: { $gt: lastId } };
				}
				return {};
			})();
			Principal.find(q).sort({ _id: 1 }).limit(1000).toArray((err, principals) => {
				if (err) return cb(err);
				if (!principals.length) return cb(null, []);
				lastId = principals[principals.length - 1]._id;

				principals.forEach(principal => {
                    principal._id = { '$oid': principal._id.toString() }; // remains the same
                    
                    // rename tconst -> imdbID
                    principal.imdbID = principal.tconst;
                    delete principal.tconst;

                    principal.characters = principal.characters === '\\N' ? undefined : principal.characters;
                    principal.job = principal.job === '\\N' ? undefined : principal.job;
					ws.write(JSON.stringify(principal) + '\n');
				});

				cb(null, principals);
			});
		},
		principals => {
			i += principals.length;
			console.log(i);
			return principals.length;
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

