import algosdk from "algosdk";
import User from "../models/interface/User";

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
 * Tokens for interacting with algosdkclients
 */
const TOKENS = {
	ALGORAND: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	KEYDAEMON: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"	// same key for testing purposes
}

/**
 * Rounds to wait for algodv2 to timeout	
 */
const DEFAULT_TIMEOUT = 10;

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
		let key = await KeyDaemonClient.client.exportKey(handle, password, address);

		await KeyDaemonClient.freeWalletHandle(handle);

		return key;
	}
}




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

		let txn = await algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, undefined, new TextEncoder().encode(note), txnParams);
		let sKey = new Uint8Array((await KeyDaemonClient.getAccountKey(walletID, password, sender)).private_key);
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

	/*
	public static fundNewAccountForTesting = async (walletID: string, password: string, receiver: string) => {
		const masterAcc = "MGTGN4OD5PFCOSDAQK5OP6S2PKOU2K6L3CVDYZNPCSIP2BBSQ46TX2HUEE";
		const testAmt = 1000000;
		let txID = await CryptoClient.basicTransaction(walletID, password, masterAcc, receiver, "", testAmt);

		return await CryptoClient.confirmTransaction(txID);
	}
	*/
}