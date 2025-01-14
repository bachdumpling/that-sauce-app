import { UserModel } from "../models/UserModel";

export const getUser = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.id);
  res.json(user);
};

