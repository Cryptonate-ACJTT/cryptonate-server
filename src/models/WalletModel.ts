import {model, Schema, Document, Model} from "mongoose";

interface Wallet extends Document {
	id: string
	accounts: Array<string>
}

const WalletSchema = new Schema<Wallet>(
	{
		id: {type: String, required: true},
		accounts: {type: [String], default: []}
	}
)

export {WalletSchema};