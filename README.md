# Cryptonate Server [v1]

## Commands

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

# docker compose stop the containers
docker compose down # newer version
docker-compose down # older version

# eslint - check code (can run to see where warnings are)
npm run lint

# running nodemon
npm run dev
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
  - utility functions
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

## TODO Note

- Keep basic entity type in the jwt token so I can create only one login method and etc...
- Differentiate the entity name being saved in the token to what is being saved as ROLE in the database for security reasons
- Flow: user press login -> server checks the toke and sees what entity this person has -> server find() on that entity to check if that person exists or not
