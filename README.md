# Hacker Suite Applications

[![Build Status](https://travis-ci.org/unicsmcr/hs_application.svg?branch=master)](https://travis-ci.org/unicsmcr/hs_hub)
![GitHub](https://img.shields.io/github/license/unicsmcr/hs_application.svg)
[![codecov](https://codecov.io/gh/unicsmcr/hs_application/branch/master/graph/badge.svg)](https://codecov.io/gh/unicsmcr/hs_application)

## Dependencies

 - Node.js (v8.0.0 or later)
 - MySQL database (v5.7 or later)

## Getting started
### Project set up
Run the following commands in the console:
```
$ git clone https://github.com/unicsmcr/hs_application.git
$ cd hs_application
$ cp .env.example .env
```

Finally, replace placeholders in .env for your own project

## Development deployment
First, complete the initial set up (above).

### Quick start with Docker
The fastest way of getting the project up and running is to use the provided `docker-compose.yml` file. Make sure you have [Docker CE](https://docs.docker.com/install/) installed on your system. Navigate to the root directory of the project and run the following:
```
$ docker-compose up -d
```
**Note**: *You can omit -d if you want to see the log output from the hub*

This will create two containers, one for the MySQL database and a NodeJS container. The first time you run the command, it will take a while since it will install the required services. Next time you run the command, it will be much faster since dependecies are cached.

If you want to shut down the hub & database containers, run the command:
```
$ docker-compose stop
```
**Note**: *Running the command above with the `-v` option will remove the database volume*

## Running the tests
Assuming you have completed the intial set up and ran `npm i`, you can run the test suite using the either of the following commands:
```
$ npm test
```
To run tests automatically everytime a change has been made to the tests, use the command below. This command will also allow you to filter tests by name, or by filename.
```
$ npm run test:watch
```` 

 ## License
 The Hacker Suite Application Platform (i.e all the code in both `src` and `test`) is licensed under the MIT License.
