import algosdk, { LogicSigAccount } from "algosdk";
import { Response } from "express";
import { readFileSync } from "fs";
import path from "path";
import User from "../models/interface/User";
import util from "util"

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
 * Valid python files to execute.
 */
const VALID_PYTEAL = [];

/************************************
	COMMON FXNS
*************************************/

const returnable = (status: string, value: unknown) => {
	return {status: status, value: value};
}

const returnError = (error: unknown) => {
	return returnable("ERROR", error);
}

const returnOther = (value: unknown) => {
	return returnable("OK", value);
}

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

	private constructor() {
		if(!CryptoClient.instance) {
			CryptoClient.instance = this;
			CryptoClient.client = new algosdk.Algodv2(TOKENS.ALGORAND, SERVER, PORTS.ALGORAND);

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

		let txn = await algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, CryptoClient.convertToMicros(amount), undefined, new TextEncoder().encode(note), txnParams);
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
		if(confirmed["confirmed-round"] > 0) {
			return true;
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
		let testAmt = 5;
		let note = "test funding";
		
		let txn = await algosdk.makePaymentTxnWithSuggestedParams(masterAcc, receiver, CryptoClient.convertToMicros(testAmt), undefined, new TextEncoder().encode(note), txnParams);
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

		console.log(compiled);

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
	 * Takes the program created by getUint8Program and makes a LogicSigAccount.
	 * @param program 
	 * @returns LogicSigAccount
	 */
	public static getLogicSignature = (program: Uint8Array) => {
		let logicSig = new LogicSigAccount(program);
		return logicSig;
	}


	/*	public static verifyPython = (path: string) => {

	}*/


	/**
	 * Runs a python program as a child process of the server, returns its stdout or null;
	 * @param path 
	 * @param callback 
	 */
	public static runPyTEAL = async (path: string) => {
		const exec = util.promisify(require("child_process").exec);

		await exec(`python3 ${path}`, (error: Error, stdout: string | Buffer, stderr: string | Buffer) => {
			if(error || stderr) {
				console.error(error, stderr);
				return null;
			}

			return stdout;
		});
	}


	public static makeProjectContract = async (creator: string) => {
		
	}	
}

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


		console.log(info);
	}
}