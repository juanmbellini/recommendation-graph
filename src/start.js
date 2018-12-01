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

    const Title = db.collection('titles')

    const typeDefs = [require('fs').readFileSync(require('path').join(__dirname, 'typeDefs.graphql')).toString()];

    const resolvers = {
      Query: {
        title: async (root, { imdbID }) => {
          return prepare(await Title.findOne({ imdbID }));
        }
      },
      Title: {
        __resolveType: (book, context, info) => {
          return 'Movie';
        }
      }
      //   post: async (root, {_id}) => {
      //     return prepare(await Posts.findOne(ObjectId(_id)))
      //   },
      //   posts: async () => {
      //     return (await Posts.find({}).toArray()).map(prepare)
      //   },
      //   comment: async (root, {_id}) => {
      //     return prepare(await Comments.findOne(ObjectId(_id)))
      //   },
      // },
      // Post: {
      //   comments: async ({_id}) => {
      //     return (await Comments.find({postId: _id}).toArray()).map(prepare)
      //   }
      // },
      // Comment: {
      //   post: async ({postId}) => {
      //     return prepare(await Posts.findOne(ObjectId(postId)))
      //   }
      // },
      // Mutation: {
      //   createPost: async (root, args, context, info) => {
      //     const res = await Posts.insertOne(args)
      //     return prepare(res.ops[0])  // https://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#~insertOneWriteOpResult
      //   },
      //   createComment: async (root, args) => {
      //     const res = await Comments.insert(args)
      //     return prepare(await Comments.findOne({_id: res.insertedIds[1]}))
      //   },
      // },
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
