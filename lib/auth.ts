import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// bcrypt hash of a throwaway string — used to equalize timing when the user
// doesn't exist. Not a secret; no real account uses this hash.
const DUMMY_HASH =
  "$2b$12$PhAt/4cLeTtJ/JWTjlFcVeamYekBKqzQmUvdZ6dhTTx7q4oahQdym";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rawEmail = credentials.email as string;
        const email = rawEmail.trim().toLowerCase();

        let user = await prisma.user.findUnique({
          where: { email },
        });
        // Legacy accounts may have been stored with original casing
        if (!user && email !== rawEmail) {
          user = await prisma.user.findUnique({ where: { email: rawEmail } });
        }

        // Always run a bcrypt compare so a non-existent user takes the same
        // time as a wrong password (prevents timing-based user enumeration).
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user?.passwordHash ?? DUMMY_HASH
        );

        if (!user || !passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
