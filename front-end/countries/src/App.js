import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./App.css";
import styled from "styled-components";

import ApolloClient from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";
import { useQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";

const client = new ApolloClient({
    uri: "https://countries.trevorblades.com/graphql",
});

function App() {
    return (
        <ApolloProvider client={client}>
            <Router>
                <div className="wrapper">
                    <div className="inner">
                        <Route exact path="/" component={Home} />
                        <Route path="/countries" component={Countries} />
                    </div>
                </div>
            </Router>
        </ApolloProvider>
    );
}

const Title = styled.h1`
    font-size: 2.5rem;
    color: palevioletred;
`;
const CountryName = styled.h2`
    font-size: 1.5em;
    color: #777;
`;
const Explain = styled.p`
    font-size: 1.4rem;
    color: #777;
`;
const LinkButton = styled.a`
    display: inline-block;
    margin-top: 1em;
    font-size: 1.4rem;
    border: 2px solid palevioletred;
    border-radius: 5px;
    padding: 5px 10px;
    color: palevioletred;
    text-decoration: none;
`;

function renderChallenge(country) {
    return (
        <Explain>
            <span>By the way, which country is this flag from?</span>
            <span style={{ marginLeft: 10 }}>
                <Link to={`countries/${country.code}`}>
                    <span style={{ fontSize: 32 }}>{country.emoji}</span>
                </Link>
            </span>
        </Explain>
    );
}

function Home() {
    const { loading, data } = useQuery(QUERY_LIST_COUNTRIES);

    return (
        <div>
            <Title>ScoutBase Country Demo</Title>
            <Explain>
                This is the initial page for the React App listing all the countries and their continents.
            </Explain>
            <LinkButton href="/countries">See the list!</LinkButton>

            {!loading && renderChallenge(data.countries[Math.floor(Math.random() * data.countries.length)])}
        </div>
    );
}

const QUERY_LIST_COUNTRIES = gql`
    {
        countries {
            name
            code
            emoji
            languages {
                name
                native
            }
            continent {
                name
            }
        }
    }
`;

const QUERY_COUNTRY = gql`
    query Country($code: String!) {
        country(code: $code) {
            name
            phone
            currency
            emoji
        }
    }
`;

function Country({ match }) {
    const { loading, error, data } = useQuery(QUERY_COUNTRY, {
        variables: { code: match.params.id },
    });

    if (loading) return <Title>Loading...</Title>;
    if (error) return <Title>Error :(</Title>;

    return (
        <div className="card-wrapper">
            <div className="card-header">
                <Title>{data.country.name}</Title>
                <span style={{ fontSize: 120 }}>{data.country.emoji}</span>
            </div>
            <div className="card-body">
                <div className="card-item">
                    <span>CURRENCY</span>
                    <span>{data.country.currency}</span>
                </div>
                <div className="card-item">
                    <span>PHONE PREFIX</span>
                    <span>{data.country.phone}</span>
                </div>
            </div>

            <LinkButton href="/countries">Back to the list</LinkButton>
        </div>
    );
}

function CountryList() {
    const { loading, error, data } = useQuery(QUERY_LIST_COUNTRIES);

    if (loading) return <Title>Loading...</Title>;
    if (error) return <Title>Error :(</Title>;

    let items = data.countries.map(({ name, code, languages, continent, emoji }) => (
        <Link to={`countries/${code}`} className="grid-item card-wrapper" key={code}>
            <div className="card-header">
                <CountryName>{name}</CountryName>
                <span style={{ fontSize: 80 }}>{emoji}</span>
            </div>
            <div className="card-body">
                {languages.map(
                    ({ name, native }) =>
                        name != null && (
                            <div className="card-item" key={name}>
                                <span>{name}</span>
                                <span>{native}</span>
                            </div>
                        )
                )}
            </div>
        </Link>
    ));
    return (
        <div>
            <Title>Listing {items.length} countries... wow!</Title>
            <Explain>Choose a country below to get more info!</Explain>
            <div className="grid-container">{items}</div>
        </div>
    );
}

function Countries({ match }) {
    return (
        <div>
            <Route path={`${match.path}/:id`} component={Country} />
            <Route exact path={match.path} component={CountryList} />
        </div>
    );
}

export default App;
