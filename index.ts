import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import jwt from "jsonwebtoken";

dotenv.config();

const extractUserFromToken = (token: string) => {
  try {
    console.log("tooooken", token);
    console.log("decodedToken", jwt.decode(token)); // Add this line
    const decodedToken: any = jwt.verify(
      token,
      process.env.SECRET_KEY || "8000"
    );
    return {
      userId: decodedToken.userId,
    };
  } catch (error: any) {
    console.error("Error verifying token:", error.message);
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
  }),
});

const server = new ApolloServer({
  gateway,
  context: ({ req }: ExpressContext) => {
    const token = req.headers.authorization || "";
    const user = extractUserFromToken(token);

    console.log("Gateway context:", { user });

    return {
      user,
    };
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
