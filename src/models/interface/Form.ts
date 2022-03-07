/**
 * This interface is used for supporting types
 * @author Aisen Kim
 */

import mongoose from "mongoose";

interface Form extends mongoose.Document {
  orgId: string;
  approved: string;
  name: string;
  EIN: string;
  website: string;
  category: string;
  location: string;
  phone: string;
  sns: [];
  orgImg: string;
}

export default Form;
