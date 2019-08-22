const { find, filter, includes, map, uniqBy } = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { graphqlExpress, graphiqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");

// Some fake data
const FAKE_ACTORS = [
    { id: 1, country: "US", birthday: "1970/01/01", name: "John Cruise" },
    { id: 2, country: "US", birthday: "1976/01/01", name: "Brad Pity" },
    { id: 3, country: "UK", birthday: "1988/01/01", name: "Emma Sherlock" },
];

const FAKE_DIRECTORS = [
    { id: 1, country: "BR", birthday: "1950/01/01", name: "Jack Carpenter" },
    { id: 2, country: "AU", birthday: "1955/01/01", name: "Steven Pittsburgh" },
    { id: 3, country: "RU", birthday: "1960/01/01", name: "Andrei Sharkovski" },
];

const FAKE_MOVIES = [
    { id: 1, year: 2009, rating: 4.5, directorId: 1, actorsId: [1, 2, 3], title: "Moneymaker" },
    { id: 2, year: 2010, rating: 1.5, directorId: 2, actorsId: [2, 3], title: "Apple" },
    { id: 3, year: 2015, rating: 4.2, directorId: 3, actorsId: [1, 2], title: "Banana" },
    { id: 4, year: 2001, rating: 3.9, directorId: 1, actorsId: [3], title: "Loner" },
];

let DB_USERS = {};
let DB_TOKENS = {};

// The GraphQL schema in string form
const typeDefs = `
type Query { 
    movies(token: String): [Movie]
    actor(id: Int!): Actor
    director(id: Int!): Director
}
type Mutation {
    createUser(username: String!, password: String!): AuthResponse
    login(username: String!, password: String!): AuthResponse
}
type AuthResponse {
    token: String!
    user: User
}
type User {
    id: Int!
    name: String
}
type Actor {
    id: Int!
    name: String
    birthday: String
    country: String
    movies: [Movie] 
    directors: [Director]
}
type Director {
    id: Int!
    name: String
    birthday: String
    country: String
    movies: [Movie]
}
type Movie {
    id: Int!
    title: String
    year: Int
    rating: Float
    director: Director
    actors: [Actor]
    scoutbase_rating: Float
  }
`;

function guid() {
    return (
        Math.random()
            .toString(36)
            .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15)
    );
}

// The resolvers
const resolvers = {
    Query: {
        movies: (_, { token }) => {
            if (!(token in DB_TOKENS)) {
                return FAKE_MOVIES;
            }
            return map(FAKE_MOVIES, function(m) {
                return { ...m, scoutbase_rating: (Math.random() * 4.0 + 5.0).toFixed(1) };
            });
        },
        actor: (_, { id }) => find(FAKE_ACTORS, { id }),
        director: (_, { id }) => find(FAKE_DIRECTORS, { id }),
    },
    Mutation: {
        createUser: async (_, { username, password }) => {
            if (username in DB_USERS) {
                return new Error("User already exists");
            }

            let token = guid();
            DB_USERS[username] = { password, token: token };
            let userID = Object.keys(DB_USERS).length;
            DB_USERS[username]["id"] = userID;
            DB_TOKENS[token] = userID;

            return {
                token,
                user: {
                    name: username,
                    username: username,
                    id: DB_USERS[username].id,
                    password: password,
                },
            };
        },
        login: async (_, { username, password }) => {
            if (username in DB_USERS && DB_USERS[username]["password"] == password) {
                return {
                    token: DB_USERS[username].token,
                    user: {
                        name: username,
                        username: username,
                        id: DB_USERS[username].id,
                    },
                };
            } else {
                return new Error("Missing user or bad password");
            }
        },
    },
    Actor: {
        movies: actor =>
            filter(FAKE_MOVIES, function(m) {
                return includes(m.actorsId, actor.id);
            }),
        directors: actor =>
            uniqBy(
                map(
                    filter(FAKE_MOVIES, function(m) {
                        return includes(m.actorsId, actor.id);
                    }),
                    function(m) {
                        return find(FAKE_DIRECTORS, { id: m.directorId });
                    }
                ),
                "id"
            ),
    },
    Movie: {
        director: movie => {
            return find(FAKE_DIRECTORS, { id: movie.directorId });
        },
        actors: movie =>
            map(movie.actorsId, function(id) {
                return find(FAKE_ACTORS, { id: id });
            }),
    },
};

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

// Initialize the app
const app = express();

// The GraphQL endpoint
app.use(
    "/graphql",
    bodyParser.json(),
    graphqlExpress({
        schema,
    })
);

// GraphiQL, a visual editor for queries
app.use(
    "/graphiql",
    graphiqlExpress({
        endpointURL: "/graphql",
    })
);

// Start the server
app.listen(3000, "0.0.0.0", () => {
    console.log("Go to http://localhost:3000/graphiql to run queries!");
});
