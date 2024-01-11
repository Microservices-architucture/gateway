import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import jwt from "jsonwebtoken";
import { Console } from "console";

dotenv.config();

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "auth",
        url: "http://localhost:5000/graphql",
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
    const authorizationHeader = req.headers.authorization || "";
    const token = authorizationHeader.split(" ")[1] || "";
    console.log("CONTEXT GATEWAY TOKEN VALUE", token);
    return { token };
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
