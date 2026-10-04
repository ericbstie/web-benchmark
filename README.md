# Tweeter

An entry for Arjay McCandless' benchmarking video: https://www.youtube.com/watch?v=sQXFhh_PiG4

## Setting up the test scenario

Arjay mentions the following setup requirements in his video:

- 4 endpoints:
  - GET /feed
  - GET /posts/:id
  - POST /posts/:id/like
  - POST /posts
- 50.000 seeded users
- 500.000 seeded posts
- 2.016.005 seeded likes

```
mise run database  # Runs postgres in a podman container
mise run seed
```

## Running the API

Mise takes care of installing bun, running `bun install` etc. Here's all you need:

```
mise run app
```
