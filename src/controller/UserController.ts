import {Request, Response} from "express";
import {donorModel} from "../models/DonorModel";
import {organizationModel} from "../models/OrganizationModel";
import * as auth from "../middleware/auth";
import bcrypt from "bcryptjs";
import User from "../models/interface/User";
import ROLE from "../models/Role";
import {adminModel} from "../models/AdminModel";
import {AuthForm, authFormModel} from "../models/AuthFormModel";
import {CryptoClient, KeyDaemonClient} from "../middleware/crypto";
import fetch from "node-fetch";
import { checkKeyExists, res404 } from "./Commons";


/**
 * User Registration and assign JWT token
 * @param req - Should contain all info including if it's an organization or not
 * @param res
 * @return 200: return user 404: error
 */
async function addUser(req: Request, res: Response) {
    const {username, password, email, role} = req.body;

    if (!username || !password || !email || !role)
        return res.status(404).json({status: "ERROR", msg: "Parameter missing"});

    // Check if it's a valid role type
    if (!Object.values(ROLE).includes(role) || role === ROLE.ADMIN) {
        return res.status(404).json({
            status: "ERROR",
            msg: "Undefined Role! If trying to register as admin, Don't",
        });
    }

    // CHECK IF USER ALREADY EXISTS BY THE email
    // const existingUser =
    //     role === ROLE.DONOR
    //         ? await donorModel.findOne({email})
    //         : await organizationModel.findOne({email});
    let existingUser = false;
    if(await donorModel.exists({email}) || await organizationModel.exists({email})){
        existingUser = true;
    }

    if (existingUser)
        return res.status(400).json({
            status: "ERROR",
            msg: `User already exists by the email: ${email}`,
        });

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    let user: User;

	try {
		let walletID = await KeyDaemonClient.newWallet(email, passwordHash);
		let newAccount = await KeyDaemonClient.newAddressFromID(walletID, passwordHash);

		let txID = await CryptoClient.fundNewAccountForTesting(newAccount);
		await CryptoClient.confirmTransaction(txID);

		role === ROLE.DONOR
        ? (user = new donorModel({
            username,
            password: passwordHash,
            email,
            role,
            wallet: {
                id: walletID,
                accounts: [newAccount]
            }

        }))
        : (user = new organizationModel({
            username,
            password: passwordHash,
            email,
            role,
            wallet: {
                id: walletID,
                accounts: [newAccount]
            },
            approved: false
        }));

		if (!user)
			return res.status(404).json({status: "ERROR", msg: "Parameter missing"});

		await user.save();

		// LOGIN THE USER
		const token = auth.signToken(user);

		// RETURN USER WITH PARTIAL DATA
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			})
			.status(200)
			.json({
				status: "OK",
				user: {
                    id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					wallet: {
						id: user.wallet.id,
						accounts: user.wallet.accounts
					},
					projects: [],
					approved: user.approved
				},
			});

	} catch (err: any) {
		console.log(err);
		return res.status(404).json(err.toString())
	}



    
}

/**
 * Expect user to provide username, password, role(admin, donor, organization)
 * @param req.body - {username, password, role}
 * @param req
 * @param res
 *
 * @return login user otherwise error response
 */
async function login(req: Request, res: Response) {
    let user: User | null;
    const {email, password} = req.body;
    console.log("ERRRROR LOGIN")
	if(!checkKeyExists({email, password})) {
		return res404(res, "Missing parameter for login!")
	}

    // CHECK IF USER IN THE DATABASE
    try {
        if (await donorModel.exists({email})) {
            user = await donorModel.findOne({email});
        } else if (await organizationModel.exists({email})) {
            user = await organizationModel.findOne({email});
        } else {
            user = await adminModel.findOne({email});
        }
    } catch (err) {
        console.log(`Error occurred finding user: ${email}`);
        return res.status(404).json({
            status: "ERROR",
            msg: "Login failed. Check email or password",
        });
    }

    // COMPARE THE PASSWORD
    try {
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = auth.signToken(user);
            console.log(user);
            return res
                .cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                })
                .status(200)
                .json({
                    status: "OK",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        wallet: {
                            id: user.wallet.id,
                            accounts: user.wallet.accounts
                        },
                        projects: user.projects,
                        approved: user.approved
                    },
                    msg: "User login success",
                });
        }
    } catch (err) {
        console.log(`Error occurred during bcrypt password comparison`);
    }

    // AT THIS POINT, RETURN ERROR
    return res.status(404).json({
        status: "ERROR",
        msg: "Login failed. Check username or password",
    });
}

function logout(req: Request, res: Response) {
    try {
        res
            .cookie("token", "", {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .status(200)
            .json({
                success: true,
                status: "OK",
            })
            .send();
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({status: "ERROR", msg: "Error while logging out"});
    }
}

async function getLoggedIn(req: Request, res: Response) {
    const userRole = req.body.role;
    console.log("username: ", req.body.username);
    console.log("role: ", req.body.role);
    // const isVerified = auth.verify(req, res);
    // if (!isVerified) {
    //     return res.status(401).json({
    //         loggedIn: false,
    //         user: null,
    //         status: "ERROR",
    //         msg: "User is not verified",
    //     });
    // }
    try {
        const loggedInUser =
            userRole === ROLE.DONOR
                ? await donorModel.findOne({username: req.body.username})
                : await organizationModel.findOne({username: req.body.username});
        return res.status(200).json({
            loggedIn: true,
            user: {
                id: loggedInUser.id,
                username: loggedInUser.username,
                email: loggedInUser.email,
                role: loggedInUser.role,
                wallet: {
                    id: loggedInUser.wallet.id,
                    accounts: loggedInUser.wallet.accounts
                },
                projects: loggedInUser.projects,
                approved: loggedInUser.approved
            },
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            loggedIn: false,
            user: null,
            status: "ERROR",
            msg: "Error getting user",
        });
    }
}

/**
 * @brief - Form for authenticating organization
 */
async function submitOrgAuthenticationForm(req: Request, res: Response) {

    const {
        orgId,
        name,
        EIN,
        category,
        email,
        phone,
        location,
        website,
    } = req.body;

    // CHECK IF ALL FIELDS ARE VALID
    if (
        !orgId ||
        !name ||
        !EIN ||
        !category ||
        !email ||
        !phone ||
        !location ||
        !website
    ) {
        return res
            .status(404)
            .json({status: "ERROR", msg: `Field missing from the form`});
    }

    try{
        // CHECK IF THE FORM EXIST FOR THE REQUESTED ORGANIZATION
        const formExists = await authFormModel.find({orgId});
        if (formExists.length > 0) {
            return res.status(409).json({
                status: "ERROR",
                msg: "The form already exists for this organization!",
            });
        }
    } catch(err) {
        console.log(err);
        return res.status(500)
            .json({status: "ERROR", msg: `Error while requesting to db`});
    }

    let approved = false;

    // MAKE EXTERNAL API CALL TO CHECK IF ORG IS LEGIT
    // IF YES, SET "approved" field to TRUE
    try {
        const apiRes = await fetch(process.env.API_URL + EIN +".json")
        const apiResJson = await apiRes.json();
        if(apiResJson.organization) {
            // set the form to be approved
            approved = true;
            // set the organization to be approved
            await organizationModel.findOneAndUpdate({_id: orgId}, {approved : true});
        }
        else{
            return res
            .status(404)
            .json({
                status: "ERROR",
                msg: `Provided EIN's 501(c)(3) status is not approved by IRS.`,
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500)
            .json({status: "ERROR", msg: `Something wrong while making external API CALL!`});
    }

    let newOrg;
    try {
        newOrg = new authFormModel({
            orgId,
            name,
            EIN,
            category,
            email,
            phone,
            location,
            website,
            approved
        });
        await newOrg.save();
    } catch (err) {
        return res
            .status(500)
            .json({status: "ERROR", msg: `Error saving the form to the database`});
    }

    res.status(201).json({status: "SUCCESS", msg: "Form successfully saved!"});
}

/**
 * Edits organization authentication form
 * @param req
 * @param res
 * orgId -> username for organization (can't be updated)
 */
 async function editOrgAuthenticationForm(req: Request, res: Response) {
    const { orgId, name, EIN, category, email, phone, location, website } =
        req.body;
        console.log(EIN)

    if (
        !name ||
        !EIN ||
        !category ||
        !email ||
        !phone ||
        !location ||
        !website
    ) {
        return res
            .status(404)
            .json({ status: "ERROR", msg: `Field missing from the form` });
    }

    if (!orgId)
        return res
            .status(404)
            .json({
                status: "ERROR",
                msg: `Provide orgId (username for organization)`,
            });

    // const orgForm: Array<AuthForm> = await authFormModel.find({orgId});
    const orgForm: AuthForm | null = await authFormModel.findOne({ orgId });
    if (!orgForm)
        return res
            .status(500)
            .json({ status: "ERROR", msg: `Organization not found` });

    try {
        const apiRes = await fetch(process.env.API_URL + EIN + ".json")
        const apiResJson = await apiRes.json();
        if (apiResJson.organization) {
            if (name) orgForm.name = name;
            if (EIN) orgForm.EIN = EIN;
            if (category) orgForm.category = category;
            if (email) orgForm.email = email;
            if (phone) orgForm.phone = phone;
            if (location) orgForm.location = location;
            if (website) orgForm.website = website;

            await orgForm.save();
        }
        else {
            return res
                .status(404)
                .json({
                    status: "ERROR",
                    msg: `Provided EIN's 501(c)(3) status is not approved by IRS.`,
                });
        }
    } catch (err) {
        console.log(err);
        return res.status(500)
            .json({ status: "ERROR", msg: `Something wrong while making external API CALL!` });
    }

    return res.status(200).json({
        status: "OK",
        msg: "Update Successful",
        form: orgForm,
    });
}


/**
 * Get organization authentication form
 * @param req
 * @param res
 */
async function getOrgAuthenticationForm(req: Request, res: Response) {
    const {orgId} = req.body;
    if (!orgId)
        return res
            .status(404)
            .json({
                status: "ERROR",
                msg: `Provide orgId (username for organization)`,
            });

    const orgForm: AuthForm | null = await authFormModel.findOne({orgId});

    if (!orgForm)
        return res
            .status(500)
            .json({status: "ERROR", msg: `Organization's auth form is not found`});

    return res.status(200).json({
        status: "OK",
        msg: "Found Form",
        form: orgForm,
    });
}

async function updateUser(req: Request, res: Response) {
    const {username, email, role} = req.body;
    if (!role) {
        return res
            .status(404)
            .json({
                status: "ERROR",
                msg: `Please provide the role of this user: ${email}`,
            });
    }
    let user: User | null;
    try {
        if (role == ROLE.DONOR) {
            user = await donorModel.findOne({email});
        } else {
            user = await organizationModel.findOne({email});
        }
    } catch (e) {
        return res.status(404).json({
            status: "ERROR",
            msg: "User doesn't exist. Please check again.",
        });
    }

    if (user && username)
        user.username = username;
    if (user && email)
        user.email = email;

    try {
        await user?.save()
    } catch (err) {
        return res.status(500).json({
            status: "ERROR",
            msg: "Error saving user. Check if user is null",
        });
    }
}

export {
    addUser,
    login,
    logout,
    getLoggedIn,
    submitOrgAuthenticationForm,
    editOrgAuthenticationForm,
    getOrgAuthenticationForm,
    updateUser
};
