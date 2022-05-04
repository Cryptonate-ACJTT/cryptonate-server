import { microalgosToAlgos } from "algosdk";
import { Request, Response } from "express";
import { CryptoClient, IndexClient, KeyDaemonClient } from "../middleware/crypto";
import { donorModel } from "../models/DonorModel";
import User from "../models/interface/User";
import { organizationModel } from "../models/OrganizationModel";
import ROLE from "../models/Role";
import { checkKeyExists, getUserFromRole, responder, res200, res404 } from "./Commons";


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

const checkBalanceHelper = async (address: string) => {
	let balance = await CryptoClient.getBalance(address);
	return balance;	
}

const checkAccountBalances = async (req: Request, res: Response) => {
	let {addresses} = req.body;

	if(addresses.length === 0) {
		return res404(res, "No accounts sent!");
	}

	let balances: any = [];

	for(let i = 0; i < addresses.length; i++) {
		balances.push({address: addresses[i], balance: microalgosToAlgos(await checkBalanceHelper(addresses[i]))})
		//balances[addresses[i]] = checkBalanceHelper(addresses[i]);
	}

	if(balances.length > 0) {
		return res200(res, "Successfully retrieved balances", {balances: balances});
	}
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
	
	if(!checkKeyExists({email, role, wallet, sender, receiver, amount})) {
		return res404(res, "Missing request parameter");
	}

	user = await getUserFromRole(role, {email});

	if(user) {
		try {
			let txID = await CryptoClient.basicTransaction(wallet, user.password, sender, receiver, "", amount);
			let confirmation = await CryptoClient.confirmTransaction(txID);

			return res200(res, `Transaction ${txID} submitted`, {
				txID: txID,
				confirmation: confirmation
			});
			
		} catch(err) {
			return res404(res, String(err));
		}
	} else {
		return res404(res, "no user found");
	}
	/*
	try {
		
		if(role == ROLE.DONOR) {
			user = await donorModel.findOne({email});
		} else {
			user = await organizationModel.findOne({email});
		}
	} catch (e) {
		return responder(res, 404, "ERROR", "USER DOESN'T EXIST", {});
	}
	*/

	/*
	if(user) {
		try {
			let txID = await CryptoClient.basicTransaction(wallet, user.password, sender, receiver, "", amount);
			let confirmation = await CryptoClient.confirmTransaction(txID);

			return res200(res, `Transaction ${txID} submitted`, {
				txID: txID,
				confirmation: confirmation
			});
		} catch(err) {
			return res404(res, String(err), {});
		}
	}*/
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
		return res404(res, "No address given");
	}

	try {
		let txnInfo = await IndexClient.getAccountTxnData(address);
		console.log(txnInfo);

		return res200(res, `Retrieved txns for ${address}: `, {txns: txnInfo});
	} catch {
		return res404(res, "Some error occurred");
	}
}


export {
	createNewWallet,

	checkAccountBalances,

	basicTxn,

	getIndexData
}