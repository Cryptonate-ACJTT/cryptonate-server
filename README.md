# Cryptonate Server [v1]

## For more detailed information, check our [design document](https://docs.google.com/document/d/1JanIrYKi1qnsd35ako7Bb2Ma6F0VMNa1e1zj3OhG4Z8/)!

## Table of Contents

0. [Requirements](#requirements)
1. [Application Setup](#commands-to-setup-app-follow-these-commands-only)
2. [Tech Stack](#technologies)
3. [Folder Structure](#folder-structure)

## Requirements

1. Need docker and docker-compose installed -> you can follow these steps https://docs.docker.com/engine/install/ubuntu/ - and also apt install docker-compose
2. Run Sandbox locally by following instruction on the github link -> [github repo](https://github.com/algorand/sandbox)
3. Disable/stop the locally installed MongoDB (If you have one)

## Commands to Setup App (Follow these commands only)

_Note 1_ - Check if `.env` file exists in the root of the project. If it doesn't pull it from the private repository in cryptonate organization repo and place the file at the root of this project

```bash
# 1. install packages
npm install

# 2. Start MongoDB (Choose one)
#2.1 Starting mongodb using docker-compose
docker-compose -f docker-compose-mongo.yml up -d

# 3. Start application
npm start     # 1. running app without nodemon
```

_Note 2_ - In order to get the Algorand/cryptocurrency portions of this app to work, you must have the Algorand Sandbox running.

```bash

# clone the sandbox from GitHub
git clone https://github.com/algorand/sandbox.git

# open the sandbox folder
cd sandbox

# run the sandbox executable to start a private network, in dev mode
./sandbox up dev
```

## Technologies

- NPM
- NODE
- TYPESCRIPT (CAN WRITE JS ON IT)
- EXPRESS
- MONGODB
- POSTMAN - Documenting the API
- DOCKER
  - Running Cryptonate app and mongodb all thorugh the container
- eslint - (npm init @eslint/config)
- ALGORAND SANDBOX
- PYTEAL / TEAL


## Folder Structure

- apiTesting
  - contains all endpoint for testing the api
  - simply install `REST Client` from vscode or use postman
- controller
  - (controller / service) contains main logic for each routes
- contracts
  - Pyteal (smart contract)
  - TEAL (compiled smart contract)
- db
	- mongodb config
- models
  - mongoose models
- middleware
  - auth middlewares, crypto middleware
- routes
  - userRoute, organizationRoute, etc
- test
  - Jest unit test
- util
  - env.ts (Temporarly using it as .env file)
  - server.ts (refactored app.ts for testing)
- app.ts
  - starting point
