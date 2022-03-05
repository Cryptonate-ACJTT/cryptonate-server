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
Object.defineProperty(exports, "__esModule", { value: true });
exports.samplePost = exports.sampleGet = void 0;
const SampleUser_1 = require("../models/SampleUser");
function sampleGet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = req.params;
        if (!username)
            return res.status(404).json({ status: "ERROR", msg: "username not found" });
        const user = yield SampleUser_1.UserModel.findOne({ username: username });
        console.log(user);
        if (!user)
            return res
                .status(404)
                .json({ status: "ERROR", msg: `User not found by the id: ${username}` });
        res.status(200).json({ user });
    });
}
exports.sampleGet = sampleGet;
function samplePost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestUser = req.body;
        const user = new SampleUser_1.UserModel({
            username: requestUser.username,
            password: requestUser.password,
            email: requestUser.email,
        });
        yield user.save();
        res.json({ status: "OK", id: user._id });
    });
}
exports.samplePost = samplePost;
