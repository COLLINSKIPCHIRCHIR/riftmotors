import {
    createService,
    getServices,
    getServiceById,
    updateService,
    deleteService

} from "../models/serviceCatalog.js";





export const addService = async(req,res)=>{

try{

const service = await createService(req.body);


res.status(201).json(service);


}catch(error){

console.log(error);

res.status(500).json({
message:"Failed to create service"
});


}

};








export const fetchServices = async(req,res)=>{

try{


const services = await getServices();


res.json(services);



}catch(error){

console.log(error);

res.status(500).json({
message:"Failed fetching services"
});


}


};







export const fetchService = async(req,res)=>{


try{


const service = await getServiceById(req.params.id);


res.json(service);



}catch(error){

console.log(error);

res.status(500).json({
message:"Failed fetching service"
});


}


};









export const editService = async(req,res)=>{


try{


const service = await updateService(
req.params.id,
req.body
);


res.json(service);



}catch(error){

console.log(error);

res.status(500).json({
message:"Failed updating service"
});


}


};







export const removeService = async(req,res)=>{


try{


await deleteService(req.params.id);


res.json({
message:"Service deleted"
});



}catch(error){


console.log(error);


res.status(500).json({
message:"Failed deleting service"
});


}



};
