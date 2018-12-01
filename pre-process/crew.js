const async = require('async');
const {MongoClient, ObjectId} = require('mongodb');
const BSON = require('bson');

require('dotenv').load();

let lastId;

const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:27017/nosql`;

(async () => {
	const db = await MongoClient.connect(MONGO_URL);

	const Crew = db.collection('crew');

	const fs = require('fs');
	const ws = fs.createWriteStream('crews.json');

	let i = 0;

	async.doWhilst(
		cb => {
			const q = (() => {
				if (lastId) {
					return { _id: { $gt: lastId } };
				}
				return {};
			})();
			Crew.find(q).sort({ _id: 1 }).limit(1000).toArray((err, crews) => {
				if (err) return cb(err);
				if (!crews.length) return cb(null, []);
				lastId = crews[crews.length - 1]._id;

				crews.forEach(crew => {
					crew._id = { '$oid': crew._id.toString() };
					crew.directors = crew.directors === '\\N' ? [] : (crew.directors || '').split(',');
					crew.writers = crew.writers === '\\N' ? [] : (crew.writers || '').split(',');
					ws.write(JSON.stringify(crew) + '\n');
				});

				cb(null, crews);
			});
		},
		crews => {
			i += crews.length;
			console.log(i);
			return crews.length;
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

