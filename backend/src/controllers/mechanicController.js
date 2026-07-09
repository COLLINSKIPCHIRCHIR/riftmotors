import {

createMechanic,
getMechanics,
getMechanicById,
updateMechanic,
deleteMechanic

} from "../models/mechanic.js";





export const addMechanic = async(req,res)=>{


try{


const mechanic =
await createMechanic(req.body);


res.status(201).json(mechanic);



}catch(error){


console.log(error);


res.status(500).json({
message:"Failed creating mechanic"
});


}

};







export const fetchMechanics = async(req,res)=>{


try{


const mechanics =
await getMechanics();


res.json(mechanics);



}catch(error){


res.status(500).json({
message:"Failed fetching mechanics"
});


}


};








export const fetchMechanic = async(req,res)=>{


const mechanic =
await getMechanicById(req.params.id);


res.json(mechanic);


};








export const editMechanic = async(req,res)=>{


const mechanic =
await updateMechanic(
req.params.id,
req.body
);


res.json(mechanic);


};








export const removeMechanic = async(req,res)=>{


await deleteMechanic(req.params.id);


res.json({
message:"Mechanic removed"
});


};