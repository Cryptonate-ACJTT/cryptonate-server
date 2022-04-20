import {Request, Response} from "express";
import {uploadFile, getFile} from "../util/s3";
import fs from "fs";
import {promisify} from "util";
import {Project, projectModel} from "../models/ProjectModel";
import {donorModel} from "../models/DonorModel";
import {KeyDaemonClient} from "../middleware/crypto";
import {organizationModel} from "../models/OrganizationModel";
import ROLE from "../models/Role";
import User from "../models/interface/User";

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
 */
async function createProject(req: Request, res: Response) {
    const {
        orgName,
        projectName,
        projectSubTitle,
        category,
        summary,
        solution,
        goalAmount,
        userInfo
    } = req.body;

    console.log(req.body);
    // CHECK IF ALL FIELDS ARE VALID
    if (
        !orgName ||
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


    console.log(req.file);

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


    console.log(userInfo)
    let user: User | null
    const userData = JSON.parse(userInfo);
    const email = userData.email;

    try {
        if (userData.role == ROLE.DONOR) {
            user = await donorModel.findOne({email});
        } else {
            user = await organizationModel.findOne({email});
        }
    } catch (e) {
        return res
            .json({status: "ERROR", msg: "Trying to create a project with no user"})
    }

    // post image to server
    const file = req.file as Express.Multer.File;
    const result = await uploadFile(file);
    await unlinkFile(file.path); // DELETE THE FILE ONCE UPLOADED TO S3

    if (user) {
        try {
            const address = await KeyDaemonClient.newAddressFromID(user.wallet.id, user.password);
            user.wallet.accounts.push(address);

            const newProject: Project = new projectModel({
                orgName,
                projectName,
                projectSubTitle,
                category,
                summary,
                solution,
                image: `/images/${result.Key}`,
                goalAmount,
                address: address
            });

            await newProject.save();

            user.projects.push(newProject);

            await user.save();

            return res.status(201).json({
                status: "SUCCESS",
                msg: "Form successfully saved!",
                project: newProject,
                wallet: user.wallet
            });
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                status: "ERROR",
                msg: "Error saving user."
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

export {
    getSingleImage,
    createProject,
    getProject,
    getFrontPageStats,
    getAllProjects,
    getProjectsBySearch,
};
