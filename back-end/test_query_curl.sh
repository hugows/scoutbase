curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{ "query": "{ movies { title year rating } }" }' \
  http://localhost:3000/graphql | jq