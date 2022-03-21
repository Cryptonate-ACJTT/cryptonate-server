import request from 'supertest';
import createServer from "../util/server";
import mongoose from 'mongoose';
import supertest from 'supertest';
import { donorModel } from '../models/DonorModel';


beforeEach((done) => {
	mongoose.connect("mongodb://localhost:27017/cryptonate", () => done());
})

afterEach((done) => {
	mongoose.connection.db.dropDatabase(() => {
	mongoose.connection.close(() => done())
	});
});

const app = createServer();

test("POST /api/v1/user", async () => { 
	const user = {username: "user1", password: "password", email: "user1@gmail.com", role: "donor"}

	await supertest(app)
	.post("/api/v1/user")
	.send(user)
	.expect(200)
	.then(async (response) => {
		expect(response.body.user.username).toBe(user.username)

		const savedUser = await donorModel.findOne({username: response.body.user.username})
		expect(savedUser).toBeTruthy()
		expect(savedUser.username).toBe(user.username);
	})
})

test("POST /api/v1/user/login", async () => {
	const user = {username: "user1", password: "password", email: "user1@gmail.com", role: "donor"}
	const login = {username: "user1", password: "password", role: "donor"};
	await supertest(app)
	.post("/api/v1/user")
	.send(user)
	.then(async createUserResponse => {

		await supertest(app)
		.post("/api/v1/user/login")
		.send(login)
		.expect(200)
		.then(async (response) => {
			expect(response.body.status).toBe("OK");
			expect(response.body.user.username).toBe(user.username);
		})
	})

})

test("POST /api/v1/user/logout", async () => {
	await supertest(app)
	.post("/api/v1/user/logout")
	.then(async response => {
		expect(response.body.status).toBe("OK")
	})
});

// describe("POST /api/v1/user/login", () => {
// 	describe("given a username and password", () => {
// 		// Should save username and password to the db
// 		// should respond with a json object containing ...

// 		// shoudl respond with 200 
// 		test("should respond with a 200 status code", async () => {
// 			const response = await request(app).post("/api/v1/user/login").send({
// 				username: "donor1",
// 				password: "password"
// 			})

// 			expect(response.statusCode).toBe(200);
// 		})

// 		// should specify json in the content type header
// 		test("should specify json in the content type header", async () => {

// 			const response = await request(app).post("/api/v1/user/login").send({
// 				username: "donor1",
// 				password: "password"
// 			})
// 			expect(response.headers['content-type']).toEqual(expect.stringContaining("json"));
// 		})
// 	})

// })