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
```

## Technologies

- NPM
- NODE
- TYPESCRIPT (CAN WRITE JS ON IT)
- EXPRESS
- MONGODB
- POSTMAN - Documenting the API
- DOCKER (Optional) - run mongodb without installing local version

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
