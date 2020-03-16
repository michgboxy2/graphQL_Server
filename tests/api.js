import axios from 'axios';

const API_URL = 'http://localhost:8000/graphql';

export const user = async variables => 
    axios.post(API_URL, {
        query: `
            query($id: ID!) {
                user(id: $id){
                    id
                    username
                    email
                    role
                }
            }`,
            variables,
    });

export const signIn = async variables => 
    await axios.post(API_URL, {
        query: `
            mutation($login: String, $password: String!){
                signIn(login: $login, password: $password){
                    token
                }
            }`,
            variables
    });

export const deleteMessage = async (variables, token) => {
    axios.post(API_URL, 
        {
            query: `
                muatation($id: ID!){
                    deleteMessage(id: $id)
                }`,
                variables,

        },
        {
            headers: {
                'x-token': token,
            },
        }
        )
}