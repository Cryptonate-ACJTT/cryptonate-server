import { Request, Response } from "express";
import { CryptoClient, IndexClient, KeyDaemonClient } from "../middleware/crypto";
import { donorModel } from "../models/DonorModel";
import User from "../models/interface/User";
import { organizationModel } from "../models/OrganizationModel";
import ROLE from "../models/Role";

const responder = (res: Response, code: number, status: string, msg: string, json: Object) => {
	return res.status(code).json({
		status: status,
		msg: msg,
		...json
	})
}

const fourohfour = (res: Response, msg: string, json: Object) => {
	return responder(res, 404, "ERROR", msg, json);
}

const twohundred = (res: Response, msg: string, json: Object) => {
	return responder(res, 200, "OK", msg, json);
}




/**
 * Pull a wallet from the ether
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
			let walletID = await KeyDaemonClient.newWallet(user.username, user.password);
			user.wallet = {
				id: walletID,
				accounts: [await KeyDaemonClient.newAddressFromID(walletID, user.password)]
			};

			
			/*{
				id: walletID,
				accounts: [
					await KeyDaemonClient.newAddressFromID(walletID, user.password)
				]
			}*/
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



/**
 * Check the account balance of an address!
 * @param req 
 * @param res 
 * @returns 
 */
const checkAccountBalace = async (req: Request, res: Response) => {
	let {address} = req.body;

	if(!address)
		return res.status(404).json({status: "ERROR", msg: "No id provided"});
	
	let balance = await CryptoClient.getBalance(address);


	if(balance >= 0) {
		return res.status(200).json({
			status: "OK",
			msg: `Balance successfully retrieved for ${address}`,
			balance: balance
		});
	}

	return res.status(404).json({status: "ERROR", msg: "Problems retrieving account balance!"});
}



/**
 * Send a basic transaction
 * @param req 
 * @param res 
 * @returns 
 */
const basicTxn = async (req: Request, res: Response) => {
	let user: User | null;
	let {email, role, wallet, sender, receiver, amount} = req.body;
	
	if(!role) {
		return responder(res, 404, "ERROR", "NO ROLE", {});
	}

	// does the user exist?
	try {
		if(role == ROLE.DONOR) {
			user = await donorModel.findOne({email});
		} else {
			user = await organizationModel.findOne({email});
		}
	} catch (e) {
		return responder(res, 404, "ERROR", "USER DOESN'T EXIST", {});
	}

	if(user) {
		let txID = await CryptoClient.basicTransaction(wallet, user.password, sender, receiver, "", amount);
		return twohundred(res, `Transaction ${txID} submitted`, {
			txID: txID,
			confirmation: await CryptoClient.confirmTransaction(txID)
		});
	}
}




/**
 * Create a new wallet address
 * @param req 
 * @param res 
 * @returns 
 */
const createNewAddress = async(req: Request, res: Response) => {
	let user: User | null;
	let {email, role, wallet} = req.body;
	
	if(!role) {
		return responder(res, 404, "ERROR", "NO ROLE", {});
	}

	try {
		if(role == ROLE.DONOR) {
			user = await donorModel.findOne({email});
		} else {
			user = await organizationModel.findOne({email});
		}
	} catch (e) {
		return responder(res, 404, "ERROR", "USER DOESN'T EXIST", {});
	}

	if(user) {
		let address = await KeyDaemonClient.newAddressFromID(wallet, user.password);
		user.wallet.accounts.push(address);
	}

	try {
		await user?.save();
	} catch(e) {
		return res.status(500).json({
			status: "ERROR",
			msg: "Error saving user."
		});
	}
}


const getIndexData = async (req: Request, res: Response) => {
	let {address} = req.body;
	if(!address) {
		return fourohfour(res, "No address given", {});
	}

	try {
		let txnInfo = await IndexClient.getAccountTxnData(address);
		console.log(txnInfo);

		return twohundred(res, `Retrieved txns for ${address}: `, {txns: txnInfo});
	} catch {
		return fourohfour(res, "Some error occurred", {});
	}
}


export {
	createNewWallet,

	checkAccountBalace,

	basicTxn,

	getIndexData
}