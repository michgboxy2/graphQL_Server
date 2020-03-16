import { expect } from 'chai';

import * as userApi from './api';

describe('users', () => {
  describe('user(id: String!): User', () => {
    it('returns a user when user can be found', async () => {
      const expectedResult = {
        data: {
            
          user: {
            id: '1',
            username: 'Michael King',
            email: 'michy@gmail.com',
            role: 'ADMIN',
          },
        },
      };
      const result = await userApi.user({ id: '1' });
      expect(result.data).to.eql(expectedResult);
    });

    it('returns null when user cannot be found', async () => {
        const expectedResult = {
          data: {
            user: null,
          },
        };
        const result = await userApi.user({ id: '42' });
        expect(result.data).to.eql(expectedResult);
      });
  });

  


describe('deleteUser(id: String!): Boolean!', () => {
    it('returns an error because only admins can delete a user', async () => {
        // const {
        //     data: {
        //         data: {
        //             signIn: {token},
        //         },
        //     },
        // } = 
        
        const token = await userApi.signIn({
            login: 'Michy lewis',
            password: 'password'
        });

        console.log(token, 'hello');

        const {
            data: {errors},
        } = await userApi.deleteMessage({id : '1'}, token);

        expect(errors[0].message).to.eql('Not authenticated as owner');
    });
});

});