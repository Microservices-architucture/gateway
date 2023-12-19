// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const { ApolloServer } = require("apollo-server");
const { readFileSync } = require("fs");
const { ApolloGateway, IntrospectAndCompose } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "auth", url: "http://localhost:4001/graphql" },
      // ...additional subgraphs...
    ],
  }),
});

// Apollo server setup
const server = new ApolloServer({
  gateway,
});

// Start server
server.listen({ port: 8000 }).then(({ url }: { url: string }) => {
  console.log(`Gateway running at ${url}`);
});


