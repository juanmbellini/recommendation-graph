const async = require('async');
const {MongoClient, ObjectId} = require('mongodb');
const BSON = require('bson');

require('dotenv').load();

let lastId;

const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:27017/nosql`;

(async () => {
	const db = await MongoClient.connect(MONGO_URL);

	const Title = db.collection('titles');
	const Rating = db.collection('ratings');

	const fs = require('fs');
	const ws = fs.createWriteStream('titles.json');

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

				async.eachLimit(titles, 50, (title, done) => {
					async.waterfall([
						next => Rating.findOne({ imdbID: title.tconst }, next),
						(rating, next) => {
							title._id = { '$oid': title._id.toString() };
							if (!Array.isArray(title.genres)) {
								title.genres = (title.genres || '').split(',').filter(v => v !== '\\N');
							}
							// rename tconst -> imdbID
							title.imdbID = title.tconst;
							delete title.tconst;
							title.isAdult = Boolean(title.isAdult);
							title.endYear = title.endYear === '\\N' ? undefined : title.endYear;
							if (rating) {
								title.averageRating = rating.averageRating;
								title.numVotes = rating.numVotes;
							}
							ws.write(JSON.stringify(title) + '\n');
							next();
						}
					], done);
				}, err => cb(err, titles));
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
			ws.on('finish', () => {
				console.log('write is finished');
				process.exit(0);
			});
			
		}
	)
})();

