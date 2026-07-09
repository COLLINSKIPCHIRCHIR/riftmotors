import {
createCustomerVehicle,
getCustomerVehicles,
getCustomerVehicleById
} from "../models/customerVehicle.js";


export const addVehicle = async(req,res)=>{

try{

const vehicle = await createCustomerVehicle(req.body);


res.json(vehicle);


}catch(error){

console.log(error);

res.status(500).json({
message:"Failed to create vehicle"
});

}

}


export const getVehicles = async(req,res)=>{

try{


const vehicles = await getCustomerVehicles();


res.json(vehicles);



}catch(error){

console.log(error);


res.status(500).json({
message:error.message
})


}

}


export const fetchVehicle = async(req,res)=>{

try{


const vehicle =
await getCustomerVehicleById(req.params.id);



if(!vehicle){

return res.status(404).json({
message:"Vehicle not found"
})

}



res.json(vehicle);



}catch(error){

console.log(error);

res.status(500).json({
message:"Server error"
})

}


}