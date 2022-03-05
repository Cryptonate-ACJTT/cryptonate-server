"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../util/server"));
let server;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    server = (0, server_1.default)();
}));
describe("GET /sample", () => {
    describe("given the user id does not exist in the requet param", () => {
        it("should return a 404", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(server).get("/api/v1/sample").expect(404);
        }));
    });
    //   describe("given the user id exists and user exists in db", () => {
    //     it("should return a user with 200", async () => {
    //       await supertest(server)
    //         .get("/api/v1/sample")
    //         .expect("Content-Type", /json/)
    //         .expect(200)
    // 		.end((err, res) => {
    // 			if(err) return done(err)
    // 			expect(res.body).toMatchObject({""})
    // 		})
    //     });
    //   });
});
