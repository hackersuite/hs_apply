# Hacker Suite: Applications

Applications system for Hackathons.

<p align="center">
  <a href="https://github.com/unicsmcr/hs_application/actions?query=workflow%3ATests" alt="Build Status">
    <img src="https://github.com/unicsmcr/hs_application/workflows/Tests/badge.svg" />
  </a>

  <a href="https://github.com/unicsmcr/hs_application/actions?query=workflow%3ALint" alt="Build Status">
    <img src="https://github.com/unicsmcr/hs_application/workflows/Lint/badge.svg" />
  </a>

  <a href="https://codecov.io/gh/unicsmcr/hs_application" alt="Coverage">
    <img src="https://codecov.io/gh/unicsmcr/hs_application/branch/master/graph/badge.svg" />
  </a>

  <a href="https://github.com/unicsmcr/hs_application/blob/master/LICENSE" alt="License">
    <img src="https://img.shields.io/github/license/unicsmcr/hs_application.svg" />
  </a>
</p>

## Dependencies

- Node.js (v10 LTS or later)
- Docker CE

## Getting started

### Project set up

Run the following commands in the console:

```
$ git clone https://github.com/unicsmcr/hs_application.git
$ cd hs_application
$ cp .env.example .env
```

Finally, replace placeholders in .env for your own project

## Deployment with Docker

The fastest way of getting the project up and running is to use the provided `docker-compose.yml` file. Make sure you have [Docker CE](https://docs.docker.com/install/) installed on your system.

### Starting the app

First, complete the initial set up (above). Then run one of the 2 commands in a terminal:

```bash
$ make up
```

or

```bash
$ make up-dev
# This will start the app with live reloading

# NOTE: you will need to restart the application whenever you install a new package or change the environment variables in the .env file
```

The first command will create two containers:

- NodeJS Applications Platform
- MySQL database

It also creates two Docker networks:

- `internal_hackathon`
- `hacker_suite`

The first time you run the command, it will take a while since it will install the required services. Next time you run the command, it will be much faster since dependencies are cached.

The NodeJS app will be available at `localhost:8010` or as `hs_application` on the `hacker_suite` network. The MySQL database will be available at `localhost:8011`, you can connect using the MySQL GUI tool of your choice

`internal_hackathon` is a network used by hs_application containers internally to communicate with each other, while `hacker_suite` is used to connect all consumer-facing Hacker Suite services.

### Logging

The output from the apps can be attached to the terminal with one of the following commands:

```bash
$ make logs // will attach the logs from all 3 containers
$ make logs-app // will attach the logs from the NodeJS app
$ make logs-db // will attach the logs from the database
```

### Stopping the app

The app can be stopped with:

```
$ make down
```

## Running the tests

Assuming you have completed the initial set up, you can run the test suite using the either of the following command:

```
$ make tests
```

## License

The Hacker Suite Application Platform (i.e all the code in `src` and `test` and `docker`) is licensed under the MIT License.
