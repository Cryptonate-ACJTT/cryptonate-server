# Cryptonate Server [v1]

## Table of Contents

1. [Application Setup](#commands-to-setup-app-follow-these-commands-only)
2. [Extra Commands](#extra-commands)
3. [Tech Stack](#technologies)
4. [Folder Structure](#folder-structure)
5. [Docker Notes](#docker-setup-note)
6. [Other Info](#note)
## Commands to Setup App (Follow these commands only)

*Note 1* - If you choose to use mongodb from local machine, please go to `src/db/dbconfig.ts` and follow instructions in the file

*Note 2* - Check if `.env` file exists in the root of the project. If it doesn't pull it from the private repository in cryptonate organization repo and place the file at the root of this project


```bash
# 1. install packages
npm install 

# 2. Start MongoDB (Choose one)
#2.1 Starting mongodb using docker-compose
docker-compose -f docker-compose-mongo.yml up -d

#2.2 Install mongo on your local machine

# 3. Start application (Run one of the two commands)
npm start     # 1. running app without nodemon
npm run dev   # 2. running app with nodemon  
```

## Extra Commands

```bash
# Install Application
npm install

# Start application
npm start

# docker compose for development
docker compose up -d # newer version
docker-compose up -d # older version

# docker compose running with new build (When configuration change and etc...)
docker compose up -d --build
docker-compose up -d --build

# docker compose stop the containers
docker compose down # newer version
docker-compose down # older version

# eslint - check code (can run to see where warnings are)
npm run lint

# running nodemon
npm run dev

################################################################################################
# Use next two commands to build and push to production repository  
docker compose -f docker-compose-prod.yml build # this will build with `latest` tag 
# building image for linux
docker buildx build --platform linux/amd64 --push --tag aisenkim15/cryptonate-dev:latest .
################################################################################################

################################## Extra Docker Commands #######################################
# docker build image with tag
docker image tag cryptonate-server_cryptonate aisenkim15/cryptonate-dev:v
# docker push to repository
docker image push aisenkim15/cryptonate-dev:v1
################################################################################################
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

## Folder Structure

- apiTesting
  - contains all endpoint for testing the api
  - simply install `thunder client` from vscode
- controller
  - (controller / service) contains main logic for each routes
- db
  - mongoose models
- middleware
  - auth middlewares
- routes
  - userRoute, organizationRoute, etc
- test
  - Jest unit test
- util
  - env.ts (Temporarly using it as .env file)
  - server.ts (refactored app.ts for testing)
- app.ts

  - starting point

  ## Docker Setup Note

- Docker development environment is setup.
- All team members can run the same version of node, typescript, package versions, mongodb, and etc
- If it works on one machine, it will work on all other machines
- Simply run `docker compose up -d` and everything is setup ready to go
- Internally, it runs `npm run dev` which is using nodemon
  - So just saving on the local machine will make all the changes
  - Cryptonate container is referencing the local app folder so all changes made are updated
- Mongo data are stored in a volume so container restarts will not delete the test data

## Note

- All routes will start with /api/[version]
- During dev, setup cors to localhost:3000
