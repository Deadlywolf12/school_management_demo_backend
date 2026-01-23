import { z } from "zod";


export const getStudentParentsSchema = z.object({
  params: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
  }),
});


export const getParentStudentsSchema = z.object({
  params: z.object({
    parentId: z.string().uuid("Invalid parent ID format"),
  }),
});


export const linkParentStudentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    parentId: z.string().uuid("Invalid parent ID format"),
  }),
});


export const unlinkParentStudentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    parentId: z.string().uuid("Invalid parent ID format"),
  }),
});


export type GetStudentParentsInput = z.infer<typeof getStudentParentsSchema>;
export type GetParentStudentsInput = z.infer<typeof getParentStudentsSchema>;
export type LinkParentStudentInput = z.infer<typeof linkParentStudentSchema>;
export type UnlinkParentStudentInput = z.infer<typeof unlinkParentStudentSchema>;