const async = require('async');
const {MongoClient, ObjectId} = require('mongodb');
const BSON = require('bson');

let lastId;

const MONGO_URL = 'mongodb://localhost:27017/nosql';

(async () => {
	const db = await MongoClient.connect(MONGO_URL);

	const Title = db.collection('titles');

	const fs = require('fs');
	const ws = fs.createWriteStream('genres_array.bson');

	let i = 0;

	async.doWhilst(
		cb => {
			const q = (() => {
				if (lastId) {
					return { _id: { $gt: lastId } };
				}
				return {};
			})();
			Title.find(q).sort({ _id: 1 }).limit(1000).toArray((err, titles) => {
				if (err) return cb(err);
				if (!titles.length) return cb(null, []);
				lastId = titles[titles.length - 1]._id;

				titles.forEach(title => {
					if (!Array.isArray(title.genres)) {
						title.genres = (title.genres || '').split(',');
					}
					title._id = { '$oid': title._id.toString() };
					title.isAdult = Boolean(title.isAdult);
					title.endYear = title.endYear === '\\N' ? undefined : title.endYear;
					ws.write(JSON.stringify(title) + '\n');
				});

				cb(null, titles);
			});
		},
		titles => {
			i += titles.length;
			console.log(i);
			return titles.length;
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

