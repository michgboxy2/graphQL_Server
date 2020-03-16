import Sequelize from 'sequelize';
import { ForbiddenError } from 'apollo-server';
import {combineResolvers} from 'graphql-resolvers';
import { isAuthenticated, isMessageOwner } from './authorization';
import pubsub, {EVENTS} from '../subscriptions';

const toCursorHash = string => Buffer.from(string).toString('base64');
const fromCursorHash = string => Buffer.from(string, 'base64').toString('ascii');


export default {
  Query: {
    messages: async (parent, {cursor, limit = 100}, { models }) => {
      const cursorOption = cursor ? {
        where:{
        createdAt: {
          [Sequelize.Op.lt]: fromCursorHash(cursor),
        },
        },
      } : {};
      
      const messages = await models.Message.findAll({
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        ...cursorOption,
      });

      const hasNextPage = messages.length > limit;
      const edges = hasNextPage ? messages.slice(0, -1) : messages;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(
            edges[edges.length - 1].createdAt.toString()
          )
        }
      }
    },
    message: async (parent, { id }, { models }) => {
      return await models.Message.findByPk(id);
    }
  },
  Mutation: {
    createMessage: combineResolvers( //combine resolvers act as a wrapper to use a middleware
      isAuthenticated,
      async (parent, { text }, { me, models }) => {
        try {
         const message = await models.Message.create({
            text,
            userId: me.id
          });

          pubsub.publish(EVENTS.MESSAGE.CREATED, {
            messageCreated: {message},
          });
          return message;
        } catch (e) {
          throw new Error(e);
        }
      }
    ),
    deleteMessage: combineResolvers(
      isAuthenticated,
      isMessageOwner,
      async (parent, { id }, { models }) => {
        return await models.Message.destroy({ where: { id } });
      }
    )
  },
  Message: {
    user: async (message, args, { loaders }) => {

      // return await models.User.findByPk(message.userId);
      return await loaders.user.load(message.userId);
    }
  },
  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.CREATED)
    }
  }
};
