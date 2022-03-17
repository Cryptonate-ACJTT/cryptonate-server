import request from 'supertest';
import createServer from "../util/server";

const app = createServer();

describe("POST /api/v1/user/login", () => {
	describe("given a username and password", () => {
		// Should save username and password to the db
		// should respond with a json object containing ...

		// shoudl respond with 200 
		test("should respond with a 200 status code", async () => {
			const response = await request(app).post("/api/v1/user/login").send({
				username: "donor1",
				password: "password"
			})

			expect(response.statusCode).toBe(200);
		})

		// should specify json in the content type header
		test("should specify json in the content type header", async () => {

			const response = await request(app).post("/api/v1/user/login").send({
				username: "donor1",
				password: "password"
			})
			expect(response.headers['content-type']).toEqual(expect.stringContaining("json"));
		})
	})

	describe("when the username and password is missing", () => {
		// should respond with a status code .... 
	})
})