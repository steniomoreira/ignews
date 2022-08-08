import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { query as q } from "faunadb";
import { fauna } from '../../../services/fauna';

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: { params: { scope: 'read:user' } },
    }),
  ],
  callbacks: {
    async signIn({user, account, profile}) {
      const { email } = user;

      const searchUserByEmail = q.Match(
        q.Index('user_by_email'),
        q.Casefold(email)
      )

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(searchUserByEmail)
            ),
            q.Create(
              q.Collection('users'),
              {data: {email}}
            ),
            q.Get(searchUserByEmail)
          )
        )        

        return true;        
      } catch{
       return false; 
      }     
    }
  }
})