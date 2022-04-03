import {Request, Response} from "express";
import {uploadFile, getFile} from "../util/s3";
import fs from "fs";
import {promisify} from "util";
import {Project, projectModel} from "../models/ProjectModel";
import {donorModel} from "../models/DonorModel";

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
        totalSaved,
        projectOpen
    } = req.body;

    // CHECK IF ALL FIELDS ARE VALID
    if (
        !orgName ||
        !projectName ||
        !projectSubTitle ||
        !category ||
        !summary ||
        !solution ||
        !goalAmount ||
        !totalSaved
    ) {
        return res
            .status(404)
            .json({status: "ERROR", msg: `Field missing from the form`});
    }

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
            .status(500)
            .json({status: "ERROR", msg: `Error saving the form to the database`});
    }

    // post image to server
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
        image: `/api/v1/images/${result.Key}`,
        goalAmount,
        totalSaved
    })

    await newProject.save();
    res.status(201).json({status: "SUCCESS", msg: "Form successfully saved!"});
}

/**
 * [GET] project by orgName(org username) and projectName
 * Need to get an image which contains the path to the image so
 * just insert it to the image tag src=`<domain> + project.image
 * @param req
 * @param res
 */
async function getProject(req: Request, res: Response) {
    const {orgName, projectName} = req.body;
    if (!orgName || !projectName)
        return res
            .status(404)
            .json({status: "ERROR", msg: `Missing orgName: ${orgName} or projectName: ${projectName}.`});
    const project = await projectModel.findOne({orgName, projectName})
    if (!project)
        return res
            .status(404)
            .json({status: "ERROR", msg: `Project not found by the projectName: ${projectName}`});
    return res
        .status(200)
        .json({
            status: "OK",
            msg: "Success",
            project
        })
}

/**
 * [GET] Open fundraiser count, amount of total donation, total donors
 * Currently, make total donors as all the registered users
 * @param req
 * @param res
 */
async function getFrontPageStats(req: Request, res: Response) {
    // GET OPEN FUNDRAISER COUNT
    const fundraiserCount = await projectModel.countDocuments({projectOpen: true})

    // GET TOTAL ALGO AMOUNT DONATED
    const total = await projectModel.aggregate([
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$totalSaved"
                }
            },
        }])
    let totalAlgo = 0;
    if (total && total.length > 0) {
        totalAlgo = total[0].total;
    }

    // GET NUMBER OF DONORS
    const donorCount = await donorModel.countDocuments();


    res.json({
        status: "OK", msg: "success", fundraiserCount, total: totalAlgo, donorCount
    })
}

export {getSingleImage, createProject, getProject, getFrontPageStats};
