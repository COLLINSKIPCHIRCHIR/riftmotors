import { getPermissions } from "../models/permissionModel.js";

export const getAllPermissions = async (req, res) => {

    try{

        const permissions =
            await getPermissions();

        res.json(permissions);

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:"Server error"
        });

    }

};