import { Request, Response } from "express";
import { KeyDaemonClient } from "../middleware/crypto";
import { donorModel } from "../models/DonorModel";
import User from "../models/interface/User";
import { organizationModel } from "../models/OrganizationModel";
import ROLE from "../models/Role";

/**
 * @param req.body - {username, email, role}
 * @param req 
 * @param res 
 * @returns 
*/
const createNewWallet = async (req: Request, res: Response) => {
	let user: User | null;
	const {email, role} = req.body;

	if(!role) {
		return res.status(404).json({
			status: "ERROR"
		});
	}

	// does the user exist?
	try {
		if(role == ROLE.DONOR) {
			user = await donorModel.findOne({email});
		} else {
			user = await organizationModel.findOne({email});
		}
	} catch (e) {
		return res.status(404).json({
			status: "ERROR",
			msg: "User doesn't exist!"
		});
	}

	// create a wallet if none
	if(user) {
		if(!user.wallet) {
			user.wallet = await KeyDaemonClient.newWallet(user.username, user.password)
		} else {
			return res.status(200).json({
				status: "OK",
				msg: "Wallet already exists for this user.",
				wallet: user.wallet
			});
		}
	}	

	// try and save
	try {
		await user?.save();
	} catch(e) {
		return res.status(500).json({
			status: "ERROR",
			msg: "Error saving user."
		})
	}

	// final success
	if(user) {
		return res.status(200).json({
			status: "OK",
			msg: "Wallet successfully created!",
			wallet: user.wallet
		});
	}


	// somehow if something breaks
	return res.status(404).json({
		status: "ERROR",
		msg: `Something went wrong creating a wallet for ${email}`
	});	
}

export {
	createNewWallet
}