# Cryptonate Server [v1]

## Commands

```bash
# Install Application
npm install

# Start application
npm start

# docker compose mongodb
docker compose up -d

# docker-compose for older version
docker-compose up -d

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
- DOCKER (Optional) - run mongodb without installing local version
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
- app.ts
  - starting point

## Note

- All routes will start with /api/[version]
- During dev, setup cors to localhost:3000

## TODO Note

- Keep basic entity type in the jwt token so I can create only one login method and etc...
- Differentiate the entity name being saved in the token to what is being saved as ROLE in the database for security reasons
- Flow: user press login -> server checks the toke and sees what entity this person has -> server find() on that entity to check if that person exists or not
