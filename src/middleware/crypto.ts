import algosdk from "algosdk";

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

	public static getInstance() {
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

	
	public static getWalletHandle = async (walletID: string, password: string) => {
		let walletHandle = (await KeyDaemonClient.client.initWalletHandle(walletID, password)).wallet_handle_id;
		return walletHandle;
	}


	public static newAddress = async (walletHandle: string) => {
		let walletAddress = (await KeyDaemonClient.client.generateKey(walletHandle)).address;
		return walletAddress;
	}
}