import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { authorize, validate } from "../middleware/validate";
import { 
  createUserSchema,
  getUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema
} from "../validators/adminValidators";
import { 
  createUser, 
  getAllUsers,
  getAllUsersByNameOnly,
 
} from "../controllers/adminController";

const adminRouter = Router();

// Apply auth to all admin routes
adminRouter.use(auth);
adminRouter.use(adminAuth);

/**
 * @route   POST /api/admin/createUsers
 * @desc    Create a new user (any role)
 * @access  Admin only
 * @body    { email, password, role, teacherDetails?, studentDetails?, staffDetails?, parentDetails? }
 */
adminRouter.post(
  "/createUsers",
  validate(createUserSchema),
  createUser
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with optional filters
 * @access  Admin only
 * @query   ?role=teacher&page=1&limit=10
 */
adminRouter.get(
  "/users",
  authorize("teacher"),
  validate(getUsersSchema),
  getAllUsers
);

adminRouter.get(
  "/users/namesOnly",
  validate(getUsersSchema),
  getAllUsersByNameOnly
);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get single user by ID
 * @access  Admin only
 * @params  userId - User's UUID
 */
// adminRouter.get(
//   "/users/:userId",
//   validate(getUserByIdSchema),
//   getUserById
// );

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user details
 * @access  Admin only
 * @params  userId - User's UUID
 * @body    Fields to update
 */
// adminRouter.put(
//   "/users/:userId",
//   validate(updateUserSchema),
//   updateUser
// );

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Admin only
 * @params  userId - User's UUID
 */
// adminRouter.delete(
//   "/users/:userId",
//   validate(deleteUserSchema),
//   deleteUser
// );

export default adminRouter;