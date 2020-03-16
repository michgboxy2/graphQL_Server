import 'dotenv/config';
import cors from 'cors';
import uuidv4 from 'uuid/v4';
import express from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import http from 'http';
import DataLoader from 'dataloader';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';
const app = express();

app.use(cors());

const batchUsers = async (keys, models) => {
    const users = await models.User.findAll({
      where: {
        id: {
          $in: keys
        },
      },
    });
    
    return keys.map((key) => {
        console.log(key);
        users.find(user => user.id === key)});
  };
  
  

const getMe = async req => {
    const token = req.headers['x-token'];

    if(token){
        try{
          return await jwt.verify(token, process.env.SECRET);
        }catch(e){
            throw new AuthenticationError('Your session expired, sign in again');
        }
    }
};

const userLoader = new DataLoader(keys => batchUsers(keys, models));

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');
    return {
      ...error,
      message,
    };
  },
  context: async ({req, connection}) => {
      if(connection){ //handles subscription
          return {
              models
          };
      }

      if(req) { //handles mutations and queries
        const me = await getMe(req);

        return {
        models,
        me,
        secret: process.env.SECRET,
        loaders: {
            user: userLoader,
          },
        }

      }

  },
});

server.applyMiddleware({ app, path: '/graphql' });

//setup subscription
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const eraseDatabaseOnSync = true;

const createUsersWithMessages = async (date) => {
    await models.User.create(
      {
        username: 'Michael King',
        email: 'michy@gmail.com',
        password: 'password',
        role: 'ADMIN',
        messages: [
          {
            text: 'Published the Road to learn React',
            createdAt: date.setSeconds(date.getSeconds() + 1)
          },
        ],
      },
      {
        include: [models.Message],
      },
    );
    await models.User.create(
      {
        username: 'Michy lewis',
        email: 'lewis@gmail.com',
        password: 'password',
        messages: [
          {
            text: 'Happy to release ...',
            createdAt: date.setSeconds(date.getSeconds() + 1)
          },
          {
            text: 'Published a complete ...',
            createdAt: date.setSeconds(date.getSeconds() + 1)
          },
        ],
      },
      {
        include: [models.Message],
      },
    );
  };

  //use test database for test
  const isTest = !!process.env.TEST_DATABASE;
  sequelize.sync({force: isTest }).then(async () => {
    if (isTest) {
        createUsersWithMessages(new Date());
      }
    
    httpServer.listen({ port: 8000 }, () => {
      console.log('Apollo Server on http://localhost:8000/graphql');
    });
  });

// sequelize.sync({force: eraseDatabaseOnSync }).then(async () => {
//     if (eraseDatabaseOnSync) {
//         createUsersWithMessages(new Date());
//       }
    
//     httpServer.listen({ port: 8000 }, () => {
//       console.log('Apollo Server on http://localhost:8000/graphql');
//     });
//   });

