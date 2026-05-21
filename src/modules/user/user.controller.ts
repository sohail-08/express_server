import type { Request, Response } from "express";
import { userService } from "./user.service";

const createUser = async(req : Request, res: Response) =>{

//   const {name, email, password, age} = req.body;
try{
   const result = await userService.createUserIntoDB(req.body);
  res.status(201).json({
    success: true,
    message : "user created",
    data : result.rows[0]
  });
} catch(error : any){
  res.status(500).json({
    success: false,
    message : error.message,
    error : error
  });
}

}

const getAllUsers = async(req : Request, res: Response) =>{

  try{
    const result = await userService.getAllusersFromDB();
      res.status(200).json({
        success: true,
        message: "all users retrieved",
        data: result.rows
      })
  }catch(error: any){
      res.status(500).json({
        success: false,
        message: error.message,
        error: error
      })
  }

}

const getSingleUser = async(req: Request, res: Response) =>{

  const {id} = req.params;

  try{
    const result = await userService.getSingleUserFromDB(id as string);
    if(result.rows.length === 0){
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      })
    }
    res.status(200).json({
      success: true,
      message: "user retrieved",
      data: result.rows[0]
    })
  } catch(error: any){
    res.status(500).json({
        success: false,
        message: error.message,
        error: error
    })
  }
}

const updateUser = async(req: Request, res: Response) =>{

  const {id} = req.params;
  const {name, password, age, is_active} = req.body;
  try{
    const result = await userService.updateUserIntoDB(id as string, req.body);
    if(result.rows.length === 0){
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      })
    }
    res.status(200).json({
      success: true,
      message: "updated successfully",
      data: result.rows[0]

    });

  } catch(error: any){
    res.status(500).json({
      success: false,
      message: error.message,
      error: error
    });

  }
}

const deleteUser = async(req: Request, res: Response) =>{

  const {id} = req.params;

  try{
    const result = await userService.deleteUserFromDB(id as string);
    if(result.rowCount === 0){
      res.status(404).json({
        success: false,
        message: "user not found",
        data: {}
      })
    }
    res.status(200).json({
      success: true,
      message: "user deleted",
      data: result.rows[0]
    })
  } catch(error: any){
    res.status(500).json({
        success: false,
        message: error.message,
        error: error
    })
  }
}

export const userController = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
}