import {Request, Response} from "express";
import {uploadFile, getFile} from "../util/s3";
import fs from "fs";
import {promisify} from "util";
import {Project, projectModel} from "../models/ProjectModel";
import {donorModel} from "../models/DonorModel";
import {CryptoClient, KeyDaemonClient, MIN_FUNDING} from "../middleware/crypto";
import {organizationModel} from "../models/OrganizationModel";
import ROLE from "../models/Role";
import User from "../models/interface/User";
import { checkKeyExists, checkModelEntryExists, getUserFromRole, MODEL_SEARCH_MODES, res200, res404, saveModel } from "./Commons";

/**
 * Contains everything related to Explore page and Project page
 */

const unlinkFile = promisify(fs.unlink);

const getSingleImage = (req: Request, res: Response) => {
    const key = req.params.key;
    const readStream = getFile(key);

    readStream.pipe(res);
};


/**
 * @brief - Request for adding a project to explore page
 *
 */
async function createProject(req: Request, res: Response) {
    let {
        orgName,
        projectName,
        projectSubTitle,
        category,
        summary,
        solution,
        goalAmount,
        userInfo
    } = req.body;

    //console.log(req.body);
    // CHECK IF ALL FIELDS ARE VALID
    if (
        !orgName||
        !projectName ||
        !projectSubTitle ||
        !category ||
        !summary ||
        !solution ||
        !goalAmount ||
        !req.file
    ) {
        return res
            .status(404)
            .json({status: "ERROR", msg: `Field missing from the form`});
    }


    //console.log(req.file);

    try {
        // CHECK IF SAME PROJECT ALREADY EXISTS
        const project = await projectModel.findOne({projectName});
        if (project) {
            return res.status(409).json({
                status: "ERROR",
                msg: `The project already exists by the name ${project.projectName}`,
            });
        }
    } catch (err) {
        return res
            .json({status: "ERROR", msg: `Error saving the form to the database`});
    }


    //console.log(userInfo)
    let user: User | null
    const userData = JSON.parse(userInfo);
    const email = userData.email;

    try {
        if (userData.role == ROLE.DONOR) {
			return res404(res, "Cannot create a project as a plain user!");
        } else {
            user = await organizationModel.findOne({email});
        }
    } catch (e) {
        return res
            .json({status: "ERROR", msg: "Trying to create a project with no user"})
    }

    if (user) {
        try {
            //const address = await KeyDaemonClient.newAddressFromID(user.wallet.id, user.password);
            //user.wallet.accounts.push(address);

			// smart contracts!!!

			let endTime = new Date();
			endTime.setFullYear(endTime.getFullYear() + 1);	// TEMPORARY; also needs close_on_funded set;
			console.log("TIME: ", endTime.getTime())

			const userBalance = await CryptoClient.getBalance(user.wallet.accounts[0]);
			if(userBalance < MIN_FUNDING) {
				return res404(res, `You need a minimum of ${CryptoClient.convertFromMicros(MIN_FUNDING)} Algos to make a project!!!`);
			}

			let contract = await CryptoClient.makeProjectContract(user.wallet.id, user.password, user.wallet.accounts[0], goalAmount, endTime, true);

			if(contract) {
				// post image to server -- moved this to later because we don't want to upload a file if no project is getting created
				const file = req.file as Express.Multer.File;
				const result = await uploadFile(file);
				await unlinkFile(file.path); // DELETE THE FILE ONCE UPLOADED TO S3

				const newProject: Project = new projectModel({
					orgName,
					projectName,
					projectSubTitle,
					category,
					summary,
					solution,
					image: `/images/${result.Key}`,
					goalAmount,
					appID: contract.appIndex,
					address: contract.appAddr,
					creatorID: user._id
				});

				await newProject.save();

				user.projects.push(newProject);
				user.wallet.accounts.push(contract.appAddr);

				await user.save();

				return res.status(201).json({
					status: "SUCCESS",
					msg: "Form successfully saved!",
					project: newProject,
					wallet: user.wallet
				});
			} else {
				return res404(res, "Contract broke somehow...");
			}
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                status: "ERROR",
                msg: "Error setting up project!"
            });
        }

    } else {
        return res.status(404).json({status: "ERROR", msg: "problems saving project"});
    }
}

/**
 * [GET] project by id
 * Need to get an image which contains the path to the image so
 * just insert it to the image tag src=`<domain> + project.image
 * @param req
 * @param res
 */
async function getProject(req: Request, res: Response) {
    const {id} = req.body;
    console.log(req);
    console.log("ID IS: ", id);
    if (!id) return res.status(404).json({status: "ERROR", msg: `Missing id.`});

    let project;
    try {
        project = await projectModel.findById(id);
    } catch (err) {
        return res
            .status(404)
            .json({status: "ERROR", msg: `Project not found by the id: ${id}`});
    }
    if (!project)
        return res
            .status(404)
            .json({status: "ERROR", msg: `Project not found by the id: ${id}`});
    return res.status(200).json({
        status: "OK",
        msg: "Success",
        project,
    });
}

/**
 * [GET] Open fundraiser count, amount of total donation, total donors
 * Currently, make total donors as all the registered users
 * @param req
 * @param res
 */
async function getFrontPageStats(req: Request, res: Response) {
    // GET OPEN FUNDRAISER COUNT
    const fundraiserCount = await projectModel.countDocuments({
        projectOpen: true,
    });

    // GET TOTAL ALGO AMOUNT DONATED
    const total = await projectModel.aggregate([
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$totalSaved",
                },
            },
        },
    ]);
    let totalAlgo = 0;
    if (total && total.length > 0) {
        totalAlgo = total[0].total;
    }

    // GET NUMBER OF DONORS
    const donorCount = await donorModel.countDocuments();

    res.json({
        status: "OK",
        msg: "success",
        fundraiserCount,
        total: totalAlgo,
        donorCount,
    });
}

/**
 * [GET] Retrieve all project for Explore Page
 * [TODO] - Later think about only sending first 20 open projects
 * @param req
 * @param res
 */
async function getAllProjects(req: Request, res: Response) {
    // GET PROJECTS
    let projects = [];
    try {
        projects = await projectModel.find();
    } catch (err) {
        return res
            .status(500)
            .json({status: "ERROR", msg: "Error retrieving project from db"});
    }

    return res.json({
        status: "OK",
        msg: "success",
        projects,
    });
}

/**
 * [GET] Get project by query parameters
 * category and search could be
 * @param req - params(category, search)
 * @param res
 */
async function getProjectsBySearch(req: Request, res: Response) {
    const categoryParam = req.query.category;
    const searchParam = req.query.search;

    let projects;

    // when both aren't provided -> returns empty array of projects
    if (!searchParam && !categoryParam) {
        return res.json({
            status: "OK",
            msg: "Search nor category were provided",
            projects: [],
        });
    }


    if (searchParam && categoryParam) {
        const searchKey = new RegExp(searchParam.toString(), 'i')
        const categoryKey = new RegExp(categoryParam.toString(), 'i');
        projects = await projectModel.find({
            category: categoryKey,
            projectName: searchKey,
        });
    } else if (searchParam) {
        const searchKey = new RegExp(searchParam.toString(), 'i')
        projects = await projectModel.find({projectName: searchKey});
    } else if(categoryParam) {
        const categoryKey = new RegExp(categoryParam.toString(), 'i');
        projects = await projectModel.find({category: categoryKey});
    }

    return res.json({status: "OK", msg: "success", projects});
}

/**
 * Delete a given app.
 * @param req 
 * @param res 
 * @returns 
 */
async function deleteProject(req: Request, res: Response) {
	let user: User | null;
	let project: Project | null;

	let {userInfo, appID} = req.body;

	if(!checkKeyExists({userInfo, appID})) {
		return res404(res, "Parameter missing!");
	}

	let email = userInfo.email;
	let role = userInfo.role;

	user = await getUserFromRole(role, {email});
	project = await checkModelEntryExists(projectModel, {appID}, MODEL_SEARCH_MODES.FIND_ONE);

	if(user && project) {
		try {
			let attempt = await CryptoClient.deleteProject(user.wallet.id, user.password, user.wallet.accounts[0], appID);
			let confirm = await CryptoClient.confirmTransaction(attempt);
			if(confirm) {
				project.projectOpen = false;
				let saved = await saveModel(project);
				if(saved) {
					return res200(res, "App delete successful", {});
				}
			}
		} catch(err) {
			console.error(err);
		}
	}

	return res404(res, "Problem deleting app");
}

export {
    getSingleImage,
    createProject,
    getProject,
    getFrontPageStats,
    getAllProjects,
    getProjectsBySearch,
	deleteProject
};
