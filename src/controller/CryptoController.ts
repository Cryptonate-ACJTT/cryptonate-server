import { microalgosToAlgos } from "algosdk";
import { Request, Response } from "express";
import { CryptoClient, IndexClient, KeyDaemonClient } from "../middleware/crypto";
import User from "../models/interface/User";
import { Project, projectModel } from "../models/ProjectModel";
import { checkKeyExists, checkModelEntryExists, getUserFromRole, MODEL_SEARCH_MODES, res200, res404, saveModel, saveUser } from "./Commons";


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

	
	if(!checkKeyExists({email, role})) {
		return res404(res, "Missing request parameter(s)!")
	}

	user = await getUserFromRole(role, {email});

	// create a wallet if none
	if(user) {
		if(!user.wallet) {
			try {
				let walletID = await KeyDaemonClient.newWallet(user.username, user.password);
				let accounts = [await KeyDaemonClient.newAddressFromID(walletID, user.password)];
				
				user.wallet = {
					id: walletID,
					accounts: accounts
				};
			} catch(err) {
				return res404(res, "Problem creating wallet!")
			}

			let saved = await saveUser(user);

			if(saved) {
				return res200(res, "Wallet successfully created!", {wallet: user.wallet});
			} else {
				return res404(res, "Problem saving user!")
			}

		} else {
			return res404(res, "Wallet for this user already exists");
		}
	}

	return res404(res, "Some problem making new wallet!");
}


/**
 * Helper method for checking address balances, reduce number of reqs to backend.
 * @param address 
 * @returns 
 */
const checkBalanceHelper = async (address: string) => {
	let balance = await CryptoClient.getBalance(address);
	return balance;	
}

/**
 * Fetch account balances for given addresses
 * @param req 
 * @param res 
 * @returns 
 */
const checkAccountBalances = async (req: Request, res: Response) => {
	let {addresses} = req.body;

	if(!checkKeyExists({addresses})){
		return res404(res, "Missing request parameter(s)!");
	}

	let balances: any = [];

	try {
		for(let address of addresses) {
			balances.push({address: address, balance: microalgosToAlgos(await checkBalanceHelper(address))})
		}
		return res200(res, "Successfully retrieved balances", {balances: balances});
	} catch (err) {
		console.error(err);
		return res404(res, "Error fetching account balances!")
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
		return res404(res, "Missing request parameter(s)");
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
	
	if(!checkKeyExists({email, role, wallet})) {
		return res404(res, "Missing request parameter(s)!");
	}

	user = await getUserFromRole(role, {email});

	if(user) {
		try {
			let address = await KeyDaemonClient.newAddressFromID(wallet, user.password);
			user.wallet.accounts.push(address);

			let saved = await saveUser(user);
			if(saved) {
				return res200(res, "Created new address and saved!", {address: address});
			} else {
				return res404(res, "Error creating new address!");
			}
		} catch(err) {
			console.error(err);
			return res404(res, "Error making new address!");
		}
	}

	return res404(res, "Problem creating new address!");
}


const getIndexData = async (req: Request, res: Response) => {
	let {address} = req.body;
	if(!address) {
		return res404(res, "No address given");
	}

	try {
		let txnInfo = await IndexClient.getAccountTxnData(address);
		//console.log(txnInfo);

		return res200(res, `Retrieved txns for ${address}: `, {txns: txnInfo});
	} catch {
		return res404(res, "Some error occurred");
	}
}


const receiveDonation = async (req: Request, res: Response) => {
	let user: User | null;
	let project: Project | null;

	let {email, role, wallet, sender, projectAddress, projectID, amount} = req.body;
	
	if(!checkKeyExists({email, role, wallet, sender, projectAddress, projectID, amount})) {
		return res404(res, "Missing request parameter(s)");
	}

	if(parseFloat(amount) === NaN) {
		return res404(res, "please use a number");
	}

	user = await getUserFromRole(role, {email});
	project = await checkModelEntryExists(projectModel, {address: projectAddress}, MODEL_SEARCH_MODES.FIND_ONE);

	if(user && project) {
		try {
			let txIDs = await CryptoClient.donateToProject(wallet, user.password, sender, projectAddress, projectID, amount);

			let confirmations = {
				dtx: await CryptoClient.confirmTransaction(txIDs.dtxID),
				ctx: await CryptoClient.confirmTransaction(txIDs.ctxID)
			}

			if(confirmations.dtx && confirmations.ctx) {
				project.totalSaved = project.totalSaved + parseFloat(amount);

				if(project.totalSaved >= project.goalAmount) {
					let delet = await CryptoClient.deleteProject(wallet, user.password, sender, projectID);
					let confirmDel = await CryptoClient.confirmTransaction(delet);
					if(confirmDel) {
						project.projectOpen = false;
						project.appID = -1;
					}
				}

				let saved = await saveModel(project);

				user.projects.push(project);

				let saved2 = await saveUser(user);

				if(saved && saved2) {
					return res200(res, "Donation submitted successfully!", {txIDs, confirmations});
				}
			}

		} catch(err) {
			return res404(res, String(err));
		}
	} else {
		return res404(res, "no user or no project found");
	}
}


export {
	createNewWallet,

	checkAccountBalances,

	basicTxn,
	receiveDonation,

	getIndexData
}