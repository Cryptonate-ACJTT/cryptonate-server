
/**
 * Contains commonly used fxns for writing controller code in other files.
 * @author Ruby Russell &-&
 */

import { Response } from "express"
import { donorModel } from "../models/DonorModel";
import { organizationModel } from "../models/OrganizationModel";
import ROLE from "../models/Role"
import { Model, Document } from "mongoose"
import User from "../models/interface/User";


/**
 * Search modes for models to search by.
 */
export enum MODEL_SEARCH_MODES {
	FIND_MANY = "find",
	FIND_ONE = "findOne",
	BY_ID = "findByID"
}

/**
 * Returns filled out Response object for ease of use.
 * @param res 
 * @param code 
 * @param status 
 * @param message 
 * @param json 
 * @returns 
 */
export const responder = (res: Response, code: number, status: string, message: string, json: object) => {
	return res.status(code).json({
		status: status,
		msg: message,
		...json
	});
}

/**
 * 404 ERROR response
 * @param res 
 * @param message 
 * @returns 
 */
export const res404 = (res: Response, message: string) => {
	return responder(res, 404, "ERROR", message, {});
}

/**
 * 200 OK response
 * @param res 
 * @param message 
 * @param json 
 * @returns 
 */
export const res200 = (res: Response, message: string, json: object) => {
	return responder(res, 200, "OK", message, json);
}

/**
 * Makes sure json objects don't break because of typescript
 */
interface jsonObj {
	[key: string] : any;
}


/**
 * Check a bunch of keys in an object and returns false if any are missing.
 * @param toCheck 
 * @returns 
 */
export const checkKeyExists = (toCheck: object) => {
	let checkObj: jsonObj = toCheck;
	let keys = Object.keys(checkObj);

	keys.forEach((key) => {
		if(!checkObj[key]) {
			return false;
		}
	});

	return true;
}


/**
 * Quick fxn to search a model for entr(y/ies) given params and a search type
 * @param model 
 * @param modelParams 
 * @param searchMode 
 * @returns 
 */
export const checkModelEntryExists = async (model: Model<any, {}, {}, {}>, modelParams: object, searchMode: MODEL_SEARCH_MODES) => {
	try {
		switch(searchMode) {
			case MODEL_SEARCH_MODES.FIND_MANY:
				return await model.find({...modelParams});
			case MODEL_SEARCH_MODES.FIND_ONE:
				return await model.findOne({...modelParams});
			case MODEL_SEARCH_MODES.BY_ID:
				return await model.findById({...modelParams});
			default:
				console.error("Default case when searching models. Uh-oh.")
				return null;
		}
	} catch(err) {
		console.error(err);
		return null;
	}
}


/**
 * Find a user and return that user if it exists, null otherwise.
 * @param role 
 * @param modelParams 
 * @returns User | null
 */
export const getUserFromRole = async (role: string, modelParams: any) => {
	let user;//: User | null;

	try {
		if((<any>Object).values(ROLE).includes(role)) {
			if(role === ROLE.DONOR) {
				user = await checkModelEntryExists(donorModel, modelParams, MODEL_SEARCH_MODES.FIND_ONE);
				return user;
			} else if(role === ROLE.ORGANIZATION) {
				user = await checkModelEntryExists(organizationModel, modelParams, MODEL_SEARCH_MODES.FIND_ONE)
				return user;
			} else {
				return null;
			}
		}
	} catch (err) {
		console.error(err);
		return null;
	}
}


/**
 * Save mongoose Document entry
 * @param entry 
 * @returns 
 */
export const saveModel = async (entry: Document) => {
	try {
		await entry.save();
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}


/**
 * Save mongoose User document
 * @param user 
 * @returns 
 */
export const saveUser = async(user: User) => {
	return await saveModel(user);
}