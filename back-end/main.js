const { find, filter, includes, map, uniqBy } = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { graphqlExpress, graphiqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");

// Some fake data
const actors = [
    { id: 1, country: "US", birthday: "1970/01/01", name: "John Cruise" },
    { id: 2, country: "US", birthday: "1976/01/01", name: "Brad Pity" },
    { id: 3, country: "UK", birthday: "1988/01/01", name: "Emma Sherlock" },
];

const directors = [
    { id: 1, country: "BR", birthday: "1950/01/01", name: "Jack Carpenter" },
    { id: 2, country: "AU", birthday: "1955/01/01", name: "Steven Pittsburgh" },
    { id: 3, country: "RU", birthday: "1960/01/01", name: "Andrei Sharkovski" },
];

const movies = [
    { id: 1, year: 2009, rating: 4.5, directorId: 1, actorsId: [1, 2, 3], title: "Moneymaker" },
    { id: 2, year: 2010, rating: 1.5, directorId: 2, actorsId: [2, 3], title: "Apple" },
    { id: 3, year: 2015, rating: 4.2, directorId: 3, actorsId: [1, 2], title: "Banana" },
    { id: 4, year: 2001, rating: 3.9, directorId: 1, actorsId: [3], title: "Loner" },
];

// The GraphQL schema in string form
const typeDefs = `
type Query { 
    movies: [Movie]
    actor(id: Int!): Actor
    director(id: Int!): Director
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
  }
`;

// The resolvers
const resolvers = {
    Query: {
        movies: () => movies,
        actor: (_, { id }) => find(actors, { id }),
        director: (_, { id }) => find(directors, { id }),
    },
    Actor: {
        movies: actor =>
            filter(movies, function(m) {
                return includes(m.actorsId, actor.id);
            }),
        directors: actor =>
            uniqBy(
                map(
                    filter(movies, function(m) {
                        return includes(m.actorsId, actor.id);
                    }),
                    function(m) {
                        return find(directors, { id: m.directorId });
                    }
                ),
                "id"
            ),
    },
    Movie: {
        director: movie => {
            return find(directors, { id: movie.directorId });
        },
        actors: movie =>
            map(movie.actorsId, function(id) {
                return find(actors, { id: id });
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
app.listen(3000, () => {
    console.log("Go to http://localhost:3000/graphiql to run queries!");
});
