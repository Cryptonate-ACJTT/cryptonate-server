import { Request, Response } from "express";
import { formModel } from "../models/FormModel";

/**
 * @brief - Request by organization to submit a form
 */
async function submitForm(req: Request, res: Response) {
  const {
    orgId,
    approved,
    name,
    EIN,
    website,
    category,
    location,
    phone,
    sns,
    orgImg,
  } = req.body;

  // CHECK IF ALL FIELDS ARE VALID
  if (
    !orgId ||
    !approved ||
    !name ||
    !EIN ||
    !website ||
    !category ||
    !location ||
    !phone
  ) {
    return res
      .status(404)
      .json({ status: "ERROR", msg: `Field missing from the form` });
  }

  let newOrg;
  try {
    // CHECK IF THE FORM EXIST FOR THE REQUESTED ORGANIZATION
    const formExists = await formModel.find({ orgId });
    if (formExists) {
      return res.status(409).json({
        status: "ERROR",
        msg: "The form already exists for this organization!",
      });
    }
    newOrg = new formModel(...req.body);
    await newOrg.save();
  } catch (err) {
    return res
      .status(500)
      .json({ status: "ERROR", msg: `Error saving the form to the database` });
  }

  res.status(201).json({ status: "SUCCESS", msg: "Form successfully saved!" });
}

export { submitForm };
