import { Express } from "express";
import supertest from "supertest";
import createServer from "../util/server";

let server: Express;

beforeAll(async () => {
  server = createServer();
});

describe("GET /sample", () => {
  describe("given the user id does not exist in the requet param", () => {
    it("should return a 404", async () => {
      await supertest(server).get("/api/v1/sample").expect(404);
    });
  });
});
