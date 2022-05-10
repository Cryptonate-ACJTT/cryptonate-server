import algosdk, { LogicSigAccount, Transaction } from "algosdk";
import { readFileSync, writeFileSync } from "fs";
import path, { resolve } from "path";
import util from "util"
import { checkModelEntryExists, MODEL_SEARCH_MODES } from "../controller/Commons";
import { donorModel } from "../models/DonorModel";

/**
 * Contains all the interactions we need with algorand stuff
 * @author Ruby Russell &-&
 */

/**
 * Algo server; specifically set up for 'sudo ./sandbox up dev'
 */
const SERVER = "http://localhost";

/**
 * Ports used by Algorand services
 */
const PORTS = {
	ALGORAND: 4001,
	KEYDAEMON: 4002, 
	INDEXER: 8980
}

/**
 * MicroAlgos in a single Algo. For reference.
 */
const MICROS_IN_ONE_ALGO = 1000000;

/**
 * Tokens for interacting with algosdkclients
 */
const TOKENS = {
	ALGORAND: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	KEYDAEMON: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"	// same key for testing purposes
}

/**
 * TESTING ONLY: devnet prefunded account mnemonics for funding test accounts
 */
const PREFUNDED_MNEMONIC = "shuffle talent arena evil upset wish economy funny hair rocket dirt friend desert recall before letter useless rule garment tower all blur goat abstract fruit"

/**
 * Rounds to wait for algodv2 to timeout	
 */
const DEFAULT_TIMEOUT = 10;

/**
 * Smart contract constants for ease of use.
 */
const PYTEAL_PATH = "../contracts/pyTEAL/"
const TEAL_PATH = "../contracts/TEAL/"
const SMART_CONTRACTS = {
	DEFAULT_CLEAR_STATE: {
		PYTEAL_PATH: PYTEAL_PATH + "default_clear_state.py",
		TEAL_PATH: TEAL_PATH + "clear_state.teal"
	},
	PROJECT: {
		PYTEAL_PATH: PYTEAL_PATH + "project.py",
		TEAL_PATH: TEAL_PATH + "project.teal",
		GLOBAL_SCHEMA: {
			INTS: 6,
			BYTES: 2,
		},
		LOCAL_SCHEMA: {
			INTS: 0,
			BYTES: 0
		}
	}
}
export const MIN_FUNDING = 100000 + (28500 * SMART_CONTRACTS.PROJECT.GLOBAL_SCHEMA.INTS) + (50000 * SMART_CONTRACTS.PROJECT.GLOBAL_SCHEMA.BYTES);



/************************************
	KEY DAEMON CLIENT
*************************************/

/**
 * Client for the Key Management Daemon.
 */
 export class KeyDaemonClient {
	private static instance: KeyDaemonClient;
	private static client: algosdk.Kmd;

	private constructor() {
		if(!KeyDaemonClient.instance) {
			KeyDaemonClient.instance = this;
			KeyDaemonClient.client = new algosdk.Kmd(TOKENS.KEYDAEMON, SERVER, PORTS.KEYDAEMON);
		}

		return KeyDaemonClient.instance;
	}


	/**
	 * Singleton getInstance() fxn for getting the key daemon, used once in app.ts
	 * @returns KeyDaemonClient
	 */
	public static getInstance = () => {
		if(!KeyDaemonClient.instance) {
			new KeyDaemonClient();
		}

		return KeyDaemonClient.instance;
	}


	/**
	 * Generate a new wallet, returns a wallet id.
	 * @param {string} name 
	 * @param {string} password 
	 * @returns wallet id
	 */
	public static newWallet = async (name: string, password: string) => {
		let walletID = (await KeyDaemonClient.client.createWallet(name, password)).wallet.id;
		return walletID;
	}


	/**
	 * Gets a wallet handle given the id and password
	 * @param walletID 
	 * @param password 
	 * @returns 
	 */
	public static getWalletHandle = async (walletID: string, password: string) => {
		let walletHandle = (await KeyDaemonClient.client.initWalletHandle(walletID, password)).wallet_handle_token;
		return walletHandle;
	}


	/**
	 * The key daemon releases the wallet handle so it cannot be used nefariously
	 * @param walletHandle 
	 * @returns 
	 */
	public static freeWalletHandle = async (walletHandle: string) => {
		return KeyDaemonClient.client.releaseWalletHandle(walletHandle);
	}


	/**
	 * Generates a new basic address/account for a wallet given a wallet handle
	 * @param walletHandle 
	 * @returns walletAddress
	 */
	public static newAddress = async (walletHandle: string) => {
		let walletAddress = (await KeyDaemonClient.client.generateKey(walletHandle)).address;
		return walletAddress;
	}


	/**
	 * Generates a new basic address/account for a wallet given the wallet ID and password
	 * @param walletID 
	 * @param password 
	 * @returns 
	 */
	public static newAddressFromID = async (walletID: string, password: string) => {
		let handle = await KeyDaemonClient.getWalletHandle(walletID, password);
		let address = await KeyDaemonClient.newAddress(handle);
		await KeyDaemonClient.freeWalletHandle(handle);

		return address;
	}


	/**
	 * Retrieves an account key for use in transactions.
	 * @param walletID 
	 * @param password 
	 * @param address 
	 * @returns 
	 */
	public static getAccountKey = async (walletID: string, password: string, address: string) => {
		let handle = await KeyDaemonClient.getWalletHandle(walletID, password);
		let sKey = new Uint8Array((await KeyDaemonClient.client.exportKey(handle, password, address)).private_key);

		await KeyDaemonClient.freeWalletHandle(handle);

		return sKey;
	}


	/**
	 * Get account private key from mnemonic.
	 * @param mnemonic 
	 * @returns 
	 */
	public static getAccountKeyFromMnemonic = async (mnemonic: string) => {
		return algosdk.mnemonicToSecretKey(mnemonic).sk;
	}


	/**
	 * Returns the wallet mnemonic, which can be used to recover a lost wallet or import one.
	 * @param walletID 
	 * @param password 
	 * @returns 
	 */
	public static exportWalletMnemonic = async (walletID: string, password: string) => {
		let handle = await KeyDaemonClient.getWalletHandle(walletID, password);
		let mdk = (await KeyDaemonClient.client.exportMasterDerivationKey(handle, password)).master_derivation_key;

		await KeyDaemonClient.freeWalletHandle(handle);

		return algosdk.secretKeyToMnemonic(new Uint8Array(mdk));
	}


	/**
	 * Export mnemonic for wallet.
	 * @param walletID 
	 * @param password 
	 * @param address 
	 * @returns 
	 */
	public static exportAccountMnemonic = async (walletID: string, password: string, address: string) => {
		let key = await KeyDaemonClient.getAccountKey(walletID, password, address);
		return algosdk.secretKeyToMnemonic(key);
	}


	/**
	 * Import an account into a wallet given a mnemonic phrase
	 * @param walletID 
	 * @param password 
	 * @param mnemonic 
	 * @returns 
	 */
	public static importAccountMnemonic = async (walletID: string, password: string, mnemonic: string) => {
		let handle = await KeyDaemonClient.getWalletHandle(walletID, password);
		let addr = (await KeyDaemonClient.client.importKey(handle, (algosdk.mnemonicToSecretKey(mnemonic).sk.toString())))
		await KeyDaemonClient.freeWalletHandle(handle);

		return addr;
	}
}



/************************************
	CRYPTO CLIENT
*************************************/

/**
 * Client for accessing Algorand
 */
export class CryptoClient {
	private static instance: CryptoClient;
	private static client: algosdk.Algodv2;
	private static programs: any;

	private constructor() {
		if(!CryptoClient.instance) {
			CryptoClient.instance = this;
			CryptoClient.client = new algosdk.Algodv2(TOKENS.ALGORAND, SERVER, PORTS.ALGORAND);
			CryptoClient.programs = {}
		}

		return CryptoClient.instance;
	}


	/**
	 * Singleton getInstance for getting the client; called in app.ts currently for initialization
	 * @returns CryptoClient
	 */
	public static getInstance = () => {
		if(!CryptoClient.instance) {
			new CryptoClient();
		}

		return CryptoClient.instance;
	}


	/**
	 * Returns the account balance of the given address
	 * @param address 
	 * @returns account info
	 */
	public static getBalance = async (address: string) => {
		let info = await CryptoClient.client.accountInformation(address).do();
		return info.amount;
	}


	/**
	 * Sends a basic transaction from sender to receiver with amount
	 * @param walletID 
	 * @param password 
	 * @param sender 
	 * @param receiver 
	 * @param note 
	 * @param amount 
	 * @returns 
	 */
	public static basicTransaction = async (walletID: string, password: string, sender: string, receiver: string, note: string, amount: number) => {
		let txnParams = await CryptoClient.client.getTransactionParams().do();
	
		if(note === "") {
			note = "MUYzRjMgRkUwRiAyMDBEIDI2QTcgRkUwRg==";
		}

		let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, CryptoClient.convertToMicros(amount), undefined, new TextEncoder().encode(note), txnParams);
		let sKey = await KeyDaemonClient.getAccountKey(walletID, password, sender);
		let signedTxn = txn.signTxn(sKey);
		let txID = txn.txID();

		await CryptoClient.client.sendRawTransaction(signedTxn).do();

		return txID;
	}
	

	/**
	 * waits for the transaction to be confirmed or rejected, returns true/false
	 * @param txID transaction id
	 * @returns 
	 */
	public static confirmTransaction = async (txID: string) => {
		let confirmed = await algosdk.waitForConfirmation(CryptoClient.client, txID, DEFAULT_TIMEOUT);

		//console.log(confirmed);
		if(confirmed["confirmed-round"] > 0) {
			return confirmed;
		}

		return false;
	}

	/**
	 * Converts μAlgos to a full Algo value. There are 1000000 μAlgos in an Algo.
	 * @param microAlgos 
	 * @returns 
	 */
	public static convertFromMicros = (μAlgos: number) => {
		return (μAlgos / MICROS_IN_ONE_ALGO);
	}

	/**
	 * Converts a full Algo value to μAlgos. There are 1000000 μAlgos in an Algo.
	 * @param fullAlgos 
	 * @returns 
	 */
	public static convertToMicros = (algos: number) => {
		return (algos * MICROS_IN_ONE_ALGO);
	}


	/**
	 * Given an account address, funds the account with 5 Algos for testing purposes.
	 * @param receiver 
	 * @returns 
	 */
	public static fundNewAccountForTesting = async (receiver: string) => {
		let masterAcc = "MGTGN4OD5PFCOSDAQK5OP6S2PKOU2K6L3CVDYZNPCSIP2BBSQ46TX2HUEE";
		let txnParams = await CryptoClient.client.getTransactionParams().do();
		let testAmt = 10;
		let note = "test funding";
		
		let txn = algosdk.makePaymentTxnWithSuggestedParams(masterAcc, receiver, CryptoClient.convertToMicros(testAmt), undefined, new TextEncoder().encode(note), txnParams);
		let sKey = new Uint8Array((await KeyDaemonClient.getAccountKeyFromMnemonic(PREFUNDED_MNEMONIC)));
		let signedTxn = txn.signTxn(sKey);
		let txID = txn.txID();

		await CryptoClient.client.sendRawTransaction(signedTxn).do();

		return txID;
	}


	/*
		TEAL INTERACTIONS
	*/


	/**
	 * takes a filepath and calls compileTealProgram
	 * @param filePath 
	 * @returns compiled TEAL program
	 */
	public static compileTealFromFile = async (filePath: string) => {
		let fp = path.join(__dirname, filePath);
		let file = readFileSync(fp);

		return await this.compileTealProgram(file);
	}


	/**
	 * Takes a contract/signature and compiles it
	 * @param contractCode 
	 * @returns compiled TEAL program
	 */
	public static compileTealProgram = async (contractCode: string | Uint8Array) => {
		let compiled = await CryptoClient.client.compile(contractCode).do();
		return compiled;
	}


	/**
	 * Takes the output of a compiled teal program (compiled.result) and turns it into a Uint8Array
	 * @param result 
	 * @returns Uint8Array
	 */
	public static getUint8Program = (result: string) => {
		let program = new Uint8Array(Buffer.from(result, "base64"));
		return program;
	}


	/**
	 * Composes compiledTealFromFile and getUint8Program for ease of use.
	 * @param fp 
	 * @returns 
	 */
	public static fullCompile = async (fp: string) => {
		return CryptoClient.getUint8Program((await CryptoClient.compileTealFromFile(fp)).result)
	}


	/**
	 * Takes the program created by getUint8Program and makes a LogicSigAccount.
	 * @param program 
	 * @returns LogicSigAccount
	 */

	/*
	public static getLogicSignature = (program: Uint8Array) => {
		let logicSig = new LogicSigAccount(program);
		return logicSig;
	}
	*/


	/**
	 * Creates an 8 byte buffer to hold a smart contract argument.
	 * @param input 
	 * @returns 
	 */
	private static makeUInt8Buffer = (input: bigint) => {
		let buffer = Buffer.alloc(8);
		buffer.writeBigUint64BE(input);
		return buffer;
	}


	/**
	 * Sets up the arguments for the project smart contract
	 * @param creator 
	 * @param goalAmt 
	 * @param endTime 
	 * @param closeOnFunded 
	 * @returns 
	 */
	private static makeProjectContractArgs = (creator: string, goalAmt: number, endTime: Date, closeOnFunded: boolean) => {
		let args: any = [
			new Uint8Array(Buffer.from(creator)),
			new Uint8Array(CryptoClient.makeUInt8Buffer(BigInt(goalAmt))),
			new Uint8Array(CryptoClient.makeUInt8Buffer(BigInt(Math.floor(new Date().getTime())))),
			new Uint8Array(CryptoClient.makeUInt8Buffer(BigInt(Math.floor(endTime.getTime() / 1000)))),
			new Uint8Array(CryptoClient.makeUInt8Buffer(BigInt(closeOnFunded ? 1 : 0)))
		]
		return args;
	}


	/**
	 * Makes sure the smart contract compiled bytecode exists; only has to be compiled once!
	 */
	private static checkProjectProgramsExist = async () => {
		if(!CryptoClient.programs.defaultClear) {
			CryptoClient.programs.defaultClear = await CryptoClient.fullCompile(SMART_CONTRACTS.DEFAULT_CLEAR_STATE.TEAL_PATH)
		}

		if(!CryptoClient.programs.project) {
			CryptoClient.programs.project = await CryptoClient.fullCompile(SMART_CONTRACTS.PROJECT.TEAL_PATH)
		}
	}


	/**
	 * Provide a minimum amount of funding for the smart contract.
	 * @param walletID 
	 * @param password 
	 * @param creatorAddress 
	 * @param projectAddress 
	 * @returns 
	 */
	public static fundProjectContract = async (walletID: string, password: string, creatorAddress: string, projectAddress: string) => {
		return await CryptoClient.basicTransaction(walletID, password, creatorAddress, projectAddress, `Funding ${projectAddress}`, CryptoClient.convertFromMicros(MIN_FUNDING));
	}


	/**
	 * Builds a Project smart contract and attempts to deploy it to the blockchain.
	 * @param walletID 
	 * @param password 
	 * @param creator 
	 * @param goalAmount 
	 * @param endTime 
	 * @param closeOnFunded 
	 * @returns 
	 */
	public static makeProjectContract = async (walletID: string, password: string, creator: string, goalAmount: number, endTime: Date, closeOnFunded: boolean ) => {
		await CryptoClient.checkProjectProgramsExist();
		
		let projectApproval = CryptoClient.programs.project;
		let projectClear = CryptoClient.programs.defaultClear;

		let txnParams = await CryptoClient.client.getTransactionParams().do();

		let projectArgs = CryptoClient.makeProjectContractArgs(creator, CryptoClient.convertToMicros(goalAmount), endTime, closeOnFunded);
		
		let txn = algosdk.makeApplicationCreateTxn(
			creator, 
			txnParams, 
			algosdk.OnApplicationComplete.NoOpOC, 
			projectApproval, 
			projectClear,
			SMART_CONTRACTS.PROJECT.LOCAL_SCHEMA.INTS,
			SMART_CONTRACTS.PROJECT.LOCAL_SCHEMA.BYTES,
			SMART_CONTRACTS.PROJECT.GLOBAL_SCHEMA.INTS,
			SMART_CONTRACTS.PROJECT.GLOBAL_SCHEMA.BYTES,
			projectArgs
		);

		let sKey = await KeyDaemonClient.getAccountKey(walletID, password, creator);
		let signedTxn = txn.signTxn(sKey);
		let txID = txn.txID();

		await CryptoClient.client.sendRawTransaction(signedTxn).do();

		let confirmation = await CryptoClient.confirmTransaction(txID);

		if(confirmation) {
			let appIndex = confirmation["application-index"];
			let appAddr = algosdk.getApplicationAddress(confirmation["application-index"]);
			let fundingTxnID = await CryptoClient.fundProjectContract(walletID, password, creator, appAddr);

			return {txID: fundingTxnID, appIndex: appIndex, appAddr: appAddr};
		} else {
			return null;
		}
	}


	/**
	 * Send a donation and also call NoOp 'donation' on the smart contract at appIndex
	 * @param walletID 
	 * @param password 
	 * @param sender 
	 * @param appAddr 
	 * @param appIndex 
	 * @param amount 
	 * @returns 
	 */
	public static donateToProject = async (walletID: string, password: string, sender: string, appAddr: string, appIndex: number, amount: number) => {
		let txnParams = await CryptoClient.client.getTransactionParams().do();

		console.log(appAddr, appIndex);

		let donateTxn = algosdk.makePaymentTxnWithSuggestedParams(sender, appAddr, CryptoClient.convertToMicros(amount), undefined, new TextEncoder().encode(`donate to ${appAddr}`), txnParams);
		let contractTxn = algosdk.makeApplicationNoOpTxn(sender, txnParams, appIndex, [new Uint8Array(Buffer.from("donation"))]);

		algosdk.assignGroupID([donateTxn, contractTxn]);

		let sKey = await KeyDaemonClient.getAccountKey(walletID, password, sender);
		
		
		let signedDonateTxn = donateTxn.signTxn(sKey);
		let signedContractTxn = contractTxn.signTxn(sKey);

		let signed = [signedDonateTxn, signedContractTxn]

		let finalTxn = await CryptoClient.client.sendRawTransaction(signed).do();
		

		//let drr = await algosdk.createDryrun({client: CryptoClient.client, txns: [algosdk.decodeSignedTransaction(signed[0]), algosdk.decodeSignedTransaction(signed[1])]});
		//const filename = 'dryrun.msgp'
		//writeFileSync(filename, algosdk.encodeObj(drr.get_obj_for_encoding(true)))

		//console.log(await CryptoClient.client.pendingTransactionInformation(finalTxn.txId).do());
		//console.log(await CryptoClient.confirmTransaction(finalTxn.txID));

		return {dtxID: donateTxn.txID(), ctxID: contractTxn.txID(), ftxID: finalTxn.txId};
	}


	/**
	 * Delete a project, only succeeds under certain parameters!
	 * @param walletID 
	 * @param password 
	 * @param sender 
	 * @param appIndex 
	 * @returns 
	 */
	public static deleteProject = async (walletID: string, password: string, sender: string, appIndex: number) => {
		let txnParams = await CryptoClient.client.getTransactionParams().do();

		let sKey = await KeyDaemonClient.getAccountKey(walletID, password, sender);
		
		let deleteApp = algosdk.makeApplicationDeleteTxn(sender, txnParams, appIndex);
		await CryptoClient.client.sendRawTransaction(deleteApp.signTxn(sKey)).do();

		return deleteApp.txID();
	}
}

// FOR TESTING, PLEASE REMOVE
/*
(async () => {
	let user = await checkModelEntryExists(donorModel, {username:"user"}, MODEL_SEARCH_MODES.FIND_ONE);
	//console.log(user.wallet.accounts[0])
	//
	try {
		//console.log(await CryptoClient.donateToProject(user.wallet.id, user.password, user.wallet.accounts[0], 'CYMJGFROP52IJ67R5QKZBCGQH4JDDLKVBGS4537O4SNOSP2K7QX3I4EEDA', 78, 0.1));
		//console.log(await CryptoClient.makeProjectContract(user.wallet.id, user.password, user.wallet.accounts[0], 1, new Date(2022, 5, 10, 20, 20, 20), true, true));
	
		//console.log(await CryptoClient.getBalance('CYMJGFROP52IJ67R5QKZBCGQH4JDDLKVBGS4537O4SNOSP2K7QX3I4EEDA'));
	} catch(err) {
		console.log(err);
	}
})();
*/


/************************************
	INDEX CLIENT
*************************************/

export class IndexClient {
	private static instance: IndexClient;
	private static client: algosdk.Indexer;

	private constructor() {
		if(!IndexClient.instance) {
			IndexClient.instance = this;
			IndexClient.client = new algosdk.Indexer("", SERVER, PORTS.INDEXER);
		}
		return IndexClient.instance;
	}


	/**
	 * Singleton getInstance for getting the client; called in app.ts currently for initialization
	 * @returns IndexClient
	 */
	public static getInstance = () => {
		if(!IndexClient.instance) {
			new IndexClient();
		}
		return IndexClient.instance;
	}


	public static getAccountTxnData = async (address: string) => {
		let info = await IndexClient.client.searchForTransactions().address(address).do();

		return info;
	}


	public static getAccByID = async (address: string, date: Date) => {
		let info = await IndexClient.client.searchForTransactions().address(address).beforeTime(date.toISOString()).do()
		//console.log(info);
	}
}