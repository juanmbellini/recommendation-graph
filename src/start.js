import {MongoClient, ObjectId} from 'mongodb';
import express from 'express';
import bodyParser from 'body-parser';
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express';
import {makeExecutableSchema} from 'graphql-tools';
import cors from 'cors';
import {prepare} from "../util/index";
import dotenv from 'dotenv';
dotenv.load();

const app = express();

app.use(cors());

const homePath = '/graphiql';
const URL = 'http://localhost';
const PORT = 3001;
const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:27017/nosql`;

export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL)

    const Title = db.collection('titles');
    const Rating = db.collection('ratings');
    const Episode = db.collection('episodes');
    const Crew = db.collection('crew');
    const Principal = db.collection('principals');

    const typeDefs = [require('fs').readFileSync(require('path').join(__dirname, 'typeDefs.graphql')).toString()];

    const TitleResolver = {
      averageRating: async ({ imdbID }, context, info) => {
        const rating = await Rating.findOne({ imdbID });
        return rating.averageRating;
      },
      numVotes: async ({ imdbID }, context, info) => {
        const rating = await Rating.findOne({ imdbID });
        return rating.numVotes;
      },
      directors: ({ imdbID }) => {
        return new Promise((resolve, reject) => {
          Crew.aggregate([{
            $match: {
              imdbID
            }
          }, {
            $unwind: '$directors'
          }, {
            $lookup: {
              from: 'principals',
              let: {
                imdbID: '$imdbID',
                directors: '$directors'
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ['$imdbID', '$$imdbID']
                    }, {
                      $eq: ['$name', '$$directors']
                    }]
                  }
                }
              }],
              as: 'principals'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $arrayElemAt: ['$principals', 0]
              }
            }
          }, {
            $lookup: {
              from: 'names',
              localField: 'name',
              foreignField: 'imdbID',
              as: 'names'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [{
                  $arrayElemAt: ['$names', 0]
                }, '$$ROOT']
              }
            }
          }, {
            $project: {
              primaryName: 1,
              birthYear: 1,
              deathYear: 1,
              primaryProfession: 1,
              knownForTitles: 1,
              imdbID: '$name',
              ordering: 1,
              category: 1,
              characters: 1,
              job: 1
            }
          }], (err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
          });
        });
      },
      writers: ({ imdbID }) => {
        return new Promise((resolve, reject) => {
          Crew.aggregate([{
            $match: {
              imdbID
            }
          }, {
            $unwind: '$writers'
          }, {
            $lookup: {
              from: 'principals',
              let: {
                imdbID: '$imdbID',
                writers: '$writers'
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ['$imdbID', '$$imdbID']
                    }, {
                      $eq: ['$name', '$$writers']
                    }]
                  }
                }
              }],
              as: 'principals'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $arrayElemAt: ['$principals', 0]
              }
            }
          }, {
            $lookup: {
              from: 'names',
              localField: 'name',
              foreignField: 'imdbID',
              as: 'names'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [{
                  $arrayElemAt: ['$names', 0]
                }, '$$ROOT']
              }
            }
          }, {
            $project: {
              primaryName: 1,
              birthYear: 1,
              deathYear: 1,
              primaryProfession: 1,
              knownForTitles: 1,
              imdbID: '$name',
              ordering: 1,
              category: 1,
              characters: 1,
              job: 1
            }
          }], (err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
          });
        });
      },
      cast: ({ imdbID }) => {
        return new Promise((resolve, reject) => {
          Principal.aggregate([{
            $match: {
              imdbID
            }
          }, {
            $lookup: {
              from: 'names',
              localField: 'name',
              foreignField: 'imdbID',
              as: 'names'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [{
                  $arrayElemAt: ['$names', 0]
                }, '$$ROOT']
              }
            }
          }, {
            $project: {
              primaryName: 1,
              birthYear: 1,
              deathYear: 1,
              primaryProfession: 1,
              knownForTitles: 1,
              imdbID: '$name',
              ordering: 1,
              category: 1,
              characters: 1,
              job: 1
            }
          }], (err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
          });
        });
      },
      actors: ({ imdbID }) => {
        return new Promise((resolve, reject) => {
          Principal.aggregate([{
            $match: {
              imdbID
            }
          }, {
            $lookup: {
              from: 'names',
              localField: 'name',
              foreignField: 'imdbID',
              as: 'names'
            }
          }, {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [{
                  $arrayElemAt: ['$names', 0]
                }, '$$ROOT']
              }
            }
          }, {
            $match: {
              category: 'actor'
            }
          }, {
            $project: {
              primaryName: 1,
              birthYear: 1,
              deathYear: 1,
              primaryProfession: 1,
              knownForTitles: 1,
              imdbID: '$name',
              ordering: 1,
              category: 1,
              characters: 1,
              job: 1
            }
          }], (err, docs) => {
            if (err) return reject(err);
            return resolve(docs);
          });
        });
      }
    };

    const resolvers = {
      Query: {
        titles: async (root, { imdbIDs }) => {
          return (await Title.find({
            imdbID: {
              $in: imdbIDs
            }
          }).toArray());
        },
        title: async (root, { imdbID }) => await Title.findOne({ imdbID }),
        movie: async (root, { imdbID }) => {
          return (await Title.findOne({
            imdbID,
            titleType: {
              $in: ['movie', 'tvMovie']
            },
          }))
        },
        short: async (root, { imdbID }) => {
          return (await Title.findOne({
            imdbID,
            titleType: {
              $in: ['short', 'tvShort']
            },
          }))
        },
        episode: async (root, { imdbID }) => {
          return (await Title.findOne({
            imdbID,
            titleType: 'tvEpisode',
          }))
        },
        series: async (root, { imdbID }) => {
          return (await Title.findOne({
            imdbID,
            titleType: {
              $in: ['tvSeries', 'tvMiniSeries']
            },
          }))
        },
      },
      Title: {
        __resolveType: (title, context, info) => {
          if (~['tvSeries', 'tvMiniSeries'].indexOf(title.titleType)) return 'Series';
          if (~['short', 'tvShort'].indexOf(title.titleType)) return 'Short';
          if (~['movie', 'tvMovie'].indexOf(title.titleType)) return 'Movie';
          return 'Episode';
        },
      },
      Movie: {
        ...TitleResolver
      },
      Short: {
        ...TitleResolver
      },
      Series: {
        ...TitleResolver,
        totalSeasons: ({ imdbID }, context, info) => {
          return new Promise((resolve, reject) => {
            Episode.aggregate([{
              $match: {
                parentTconst: imdbID
              }
            }, {
              $group: {
                _id: '$seasonNumber'
              }
            }, {
              $count: 'total'
            }], (err, doc) => {
              if (err) return reject(err);
              return resolve(doc.length ? doc[0].total : 0);
            });
          });
        },
        episodes: ({ imdbID }, { season }, info) => {
          return new Promise((resolve, reject) => {
            const q = {
              parentTconst: imdbID
            };
            if (season && season.length) {
              q.seasonNumber = { $in: season };
            }
            Episode.aggregate([{
              $match: q
            }, {
              $sort: {
                episodeNumber: 1
              }
            }, {
              $lookup: {
                from: 'titles',
                localField: 'imdbID',
                foreignField: 'imdbID',
                as: 'episode'
              }
            }, {
              $project: {
                _id: 0,
                episode: {
                  $arrayElemAt: ['$episode', 0]
                }
              }
            }], (err, doc) => {
              if (err) return reject(err);
              return resolve(doc.map(d => d.episode));
            });
          });
        }
      },
      Episode: {
        ...TitleResolver,
        seasonNumber: async ({ imdbID }, context, info) => {
          const episode = await Episode.findOne({ imdbID });
          return episode.seasonNumber;
        },
        episodeNumber: async ({ imdbID }, context, info) => {
          const episode = await Episode.findOne({ imdbID });
          return episode.episodeNumber;
        },
        series: async ({ imdbID }, context, info) => {
          const episode = await Episode.findOne({ imdbID });
          const series = await Title.findOne({ imdbID: episode.parentTconst });
          return series;
        },
      },
      Principal: {
        knownForTitles: async ({ knownForTitles }, context, info) => {
          return (await Title.find({ imdbID: { $in: knownForTitles }}).toArray());
        },
      }
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })


    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))


    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
