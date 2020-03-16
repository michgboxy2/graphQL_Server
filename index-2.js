import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import uuidv4 from 'uuid/v4';
import {ApolloServer, gql} from 'apollo-server-express';

const app = express();

app.use(cors());

const schema = gql`
    type Query {
        me: User
        user(id: ID!): User
        users: [User!]
        
        message(id: ID!): Message
        messages: [Message!]
    }

    type Mutation {
        createMessage(text: String!): Message!
        deleteMessage(id: ID!): Boolean!
        updateMessage(id: ID!, text: String!): Message!
    }

    type User {
        id: ID!
        username: String!
        messages: [Message!]
    }

    type Message {
        id: ID!
        text: String!
        user: User!
    }


    
`;



let users = {
    1: {
      id: '1',
      username: 'Michael king',
      messageIds: [1]
    },
    2: {
      id: '2',
      username: 'Anike Muniratu',
      messageIds: [2]
    },
  };

let messages = {
    1: {
      id: '1',
      text: 'Hello World',
      userId: '1'
    },
    2: {
      id: '2',
      text: 'By World',
      userId: '2'
    },
  };
  


const resolvers = {
    Query: {
        me: (parent, args, {me}) => {
            return me;
        },

        user: (parent, args) => {
            return users[args.id];
        },

        users: () => {
            return Object.values(users);
        },

        message: (parent, {id}) => {
            return messages[id];
        },

        messages: () => {
            return Object.values(messages);
        }
    },

    Mutation: {
        createMessage: (parent, {text}, {me}) => {
            const id = uuidv4();
            const message = {
                id,
                text,
                userId: me.id
            };

            messages[id] = message;
            users[me.id].messageIds.push(id);

            return message;
        },

        deleteMessage: (parent, {id}) => {
            const {[id] : message, ...otherMessages} = messages;

            if(!message){
                return false;
            }

            message = otherMessages;

            return true;
        },

        updateMessage: (parent, {text, id}, {me}) => {
            let message = messages[id];
            if(!message){
                return false;
            }
            message.text = text;

            messages[id] = message;
            

            return message;
        }
    },

    Message: {
        user: (message) => { return users[message.userId]}
    },

    User: {
        username: parent => {
            return parent.username;
        },
        messages: user => {
            return Object.values(messages).filter(
                message => message.userId === user.id
            )
        }
    }
}

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: {
        me: users[1]
    }
});

server.applyMiddleware({app, path: '/graphQL'});

app.listen({port: 8000}, () => {
    console.log('Apollo server started on http://localhost:8000/graphql');
});
