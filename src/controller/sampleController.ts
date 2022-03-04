import {Request, Response} from 'express'
import {UserModel, User} from '../models/SampleUser'

export function sampleGet(req: Request, res: Response) {
    console.log("Sample Route")
    res.json({"This": "This", "Is": "Is", "Sample": "Sample"})
}

export async function samplePost(req: Request, res: Response) {
    const requestUser: User = req.body;
    const user = new UserModel({
        username: requestUser.username,
        password: requestUser.password,
        email: requestUser.email 
    })
    await user.save()
    res.json({status: "OK"})
}