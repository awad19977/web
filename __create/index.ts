import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool } from 'pg';
import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';
import { ensureUserFeatureDefaults, getUserFeatureMap } from '../src/app/api/utils/permissions';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = NeonAdapter(pool);

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

if (process.env.AUTH_SECRET) {
  app.use(
    '*',
    initAuthConfig((c) => ({
      basePath: '/api/auth',
      secret: c.env.AUTH_SECRET,
      url: process.env.AUTH_URL || 'http://localhost:4000',
      pages: {
        signIn: '/account/signin',
        signOut: '/account/logout',
      },
      skipCSRFCheck,
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        async jwt({ token, user }) {
          const authToken = token as typeof token & {
            username?: string;
            features?: Record<string, boolean>;
          };
          if (user?.id) {
            authToken.features = await getUserFeatureMap(user.id);
            if ('username' in user && user.username) {
              authToken.username = user.username as string;
            } else {
              const dbUser = await adapter.getUser(user.id);
              if (dbUser && 'username' in dbUser) {
                authToken.username = (dbUser as { username?: string }).username ?? authToken.username;
              }
            }
          } else if (token.sub) {
            if (!authToken.features) {
              authToken.features = await getUserFeatureMap(token.sub);
            }
            if (!authToken.username) {
              const dbUser = await adapter.getUser(token.sub);
              if (dbUser && 'username' in dbUser) {
                authToken.username = (dbUser as { username?: string }).username ?? authToken.username;
              }
            }
          }
          return authToken;
        },
        session({ session, token }) {
          const authToken = token as typeof token & {
            username?: string;
            features?: Record<string, boolean>;
          };
          if (token.sub) {
            session.user.id = token.sub;
          }
          if (session.user) {
            session.user = {
              ...session.user,
              username: authToken.username ?? (session.user as { username?: string }).username,
              features: authToken.features ?? {},
            } as typeof session.user & {
              features: Record<string, boolean>;
              username?: string;
            };
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
           secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          },
        },
        sessionToken: {
          options: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          },
        },
        callbackUrl: {
          options: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          },
        },
      },
      providers: [
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            username: {
              label: 'Username',
              type: 'text',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { username, password } = credentials;
            if (!username || !password) {
              return null;
            }
            if (typeof username !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const normalizedUsername = username.trim().toLowerCase();
            if (!normalizedUsername) {
              return null;
            }
            const user = await adapter.getUserByUsername(normalizedUsername);
            if (!user) {
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              return null;
            }

            const isValid = await verify(accountPassword, password);
            if (!isValid) {
              return null;
            }

            // return user object with the their profile data
            return user;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Sign up',
          credentials: {
            username: {
              label: 'Username',
              type: 'text',
            },
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { username, email, password } = credentials;
            if (!username || !email || !password) {
              return null;
            }
            if (
              typeof username !== 'string' ||
              typeof email !== 'string' ||
              typeof password !== 'string'
            ) {
              return null;
            }

            // logic to verify if user exists
            const normalizedUsername = username.trim().toLowerCase();
            if (!normalizedUsername) {
              return null;
            }
            const normalizedEmail = email.trim().toLowerCase();

            const existingUsername = await adapter.getUserByUsername(normalizedUsername);
            if (existingUsername) {
              return null;
            }

            const existingEmail = await adapter.getUserByEmail(normalizedEmail);
            if (existingEmail) {
              return null;
            }

            const newUser = await adapter.createUser({
              id: randomUUID(),
              email: normalizedEmail,
              emailVerified: null,
              name: normalizedUsername,
              image: null,
              username: normalizedUsername,
            });
            await adapter.linkAccount({
              extraData: {
                password: await hash(password),
              },
              type: 'credentials',
              userId: newUser.id,
              providerAccountId: newUser.id,
              provider: 'credentials',
            });
            await ensureUserFeatureDefaults(newUser.id);
            return newUser;
          },
        }),
      ],
    }))
  );
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// app.use('/api/auth/*', async (c, next) => {
//   if (isAuthAction(c.req.path)) {
//     return authHandler()(c, next);
//   }
//   return next();
// });
app.use('/api/auth/*', authHandler());

app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
});
