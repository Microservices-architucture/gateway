import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import jwt from "jsonwebtoken";

dotenv.config();

const context = ({ req }: ExpressContext) => {
  const authorizationHeader = req.headers.authorization || "";
  const [bearer, token] = authorizationHeader.split(" ");

  if (bearer && bearer.toLowerCase() === "bearer" && token) {
    const user = extractUserFromToken(token);
    console.log("Gateway context:", { user });
    return { user };
  } else {
    console.error("Invalid authorization header format");
    return { user: null };
  }
};

const extractUserFromToken = (token: string) => {
  try {
    console.log("Token value:", token); // Log the token
    const decodedToken: any = jwt.verify(
      token,
      process.env.SECRET_KEY || "8000",
      { ignoreExpiration: false } // Ensure token is not expired
    );
    console.log("Decoded token:", decodedToken);
    return {
      userId: decodedToken.userId,
    };
  } catch (error) {
    console.error(
      "Error verifying token:",
      (error as { message: string }).message
    );
    return null;
  }
};

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "auth",
        url: "http://localhost:4001/graphql",
      },
      {
        name: "posts",
        url: "http://localhost:7006/graphql",
      },
    ],

    introspectionHeaders: {
      originalAuthorization: "Bearer abc123",
    },
  }),
});

const server = new ApolloServer({
  gateway,
  context: ({ req }: ExpressContext) => {
    console.log("Headers in posts service:", req.headers);

    const authorizationHeader = req.headers.authorization || "";
    console.log("Gateway context:", { authorizationHeader });

    const [bearer, token] = authorizationHeader.split(" ");

    if (bearer && bearer.toLowerCase() === "bearer" && token) {
      const user = extractUserFromToken(token);
      console.log("Gateway context:", { user });
      return {
        user,
        headers: {
          authorization: token,
        },
      };
    } else {
      console.error("Invalid authorization header format");
      return { user: null };
    }
  },
});

const app = express();

app.use(cors());

(async () => {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 8000;

  app.listen(PORT, () => {
    console.log(`Gateway running at http://localhost:${PORT}/graphql`);
  });
})();
