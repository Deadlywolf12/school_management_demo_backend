// db/seed.ts
//
// Seed script — run once after migrations:
//   npx tsx db/seed.ts
//
// Inserts in FK order:
//   users → subjects → classes → class_subjects → students → teachers → parents → staff → student_grades
//
// Flow:
//   1. Create users for all roles
//   2. Create subjects (to be used in class_subjects)
//   3. Create classes (basic class records)
//   4. Update class_subjects with subject mappings
//   5. Create students and assign to classes
//   6. Create teachers and assign as class teachers
//   7. Create parents and staff
//   8. Seed historical grades
// ─────────────────────────────────────────────────────────────────

import { db } from "./db/index"; 
import { users } from "./db/schema/users";
import { subjects } from "./db/schema/subjects";
import { students } from "./db/schema/students";
import { teachers } from "./db/schema/teacher";
import { parents } from "./db/schema/parents";
import { staff } from "./db/schema/staff";
import { classes } from "./db/schema/classes";
import { classSubjects, studentGrades } from "./db/schema/grades";

// ─── Deterministic UUIDs so the seed is repeatable ──────────────
const USER_IDS = {
  // students (10)
  student1:  crypto.randomUUID(),
  student2:  crypto.randomUUID(),
  student3:  crypto.randomUUID(),
  student4:  crypto.randomUUID(),
  student5:  crypto.randomUUID(),
  student6:  crypto.randomUUID(),
  student7:  crypto.randomUUID(),
  student8:  crypto.randomUUID(),
  student9:  crypto.randomUUID(),
  student10: crypto.randomUUID(),
  // teachers (5)
  teacher1:  crypto.randomUUID(),
  teacher2:  crypto.randomUUID(),
  teacher3:  crypto.randomUUID(),
  teacher4:  crypto.randomUUID(),
  teacher5:  crypto.randomUUID(),
  // parents (4, one per first 4 students)
  parent1:   crypto.randomUUID(),
  parent2:   crypto.randomUUID(),
  parent3:   crypto.randomUUID(),
  parent4:   crypto.randomUUID(),
  // staff (3)
  staff1:    crypto.randomUUID(),
  staff2:    crypto.randomUUID(),
  staff3:    crypto.randomUUID(),
};

const STUDENT_ROW_IDS = {
  student1:  crypto.randomUUID(),
  student2:  crypto.randomUUID(),
  student3:  crypto.randomUUID(),
  student4:  crypto.randomUUID(),
  student5:  crypto.randomUUID(),
  student6:  crypto.randomUUID(),
  student7:  crypto.randomUUID(),
  student8:  crypto.randomUUID(),
  student9:  crypto.randomUUID(),
  student10: crypto.randomUUID(),
};

const SUBJECT_IDS = {
  math:          crypto.randomUUID(),
  english:       crypto.randomUUID(),
  urdu:          crypto.randomUUID(),
  science:       crypto.randomUUID(),
  socialStudies: crypto.randomUUID(),
  computerSci:   crypto.randomUUID(),
  physics:       crypto.randomUUID(),
  chemistry:     crypto.randomUUID(),
  biology:       crypto.randomUUID(),
  economics:     crypto.randomUUID(),
};

const CLASS_IDS = {
  class3A: crypto.randomUUID(),
  class4A: crypto.randomUUID(),
  class5A: crypto.randomUUID(),
  class6A: crypto.randomUUID(),
};

const TEACHER_IDS = {
  teacher1: crypto.randomUUID(),
  teacher2: crypto.randomUUID(),
  teacher3: crypto.randomUUID(),
  teacher4: crypto.randomUUID(),
  teacher5: crypto.randomUUID(),
};

// ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱  Starting seed…\n");

  // ── 1. USERS ────────────────────────────────────────────────────
  console.log("  inserting users…");
  await db.insert(users).values([
    // student users
    { id: USER_IDS.student1,  email: "ali.khan@school.com",      password: "hashed_pw", role: "student" },
    { id: USER_IDS.student2,  email: "sara.ahmed@school.com",   password: "hashed_pw", role: "student" },
    { id: USER_IDS.student3,  email: "omar.malik@school.com",   password: "hashed_pw", role: "student" },
    { id: USER_IDS.student4,  email: "zara.iqbal@school.com",   password: "hashed_pw", role: "student" },
    { id: USER_IDS.student5,  email: "yusuf.naqvi@school.com",  password: "hashed_pw", role: "student" },
    { id: USER_IDS.student6,  email: "leila.shah@school.com",   password: "hashed_pw", role: "student" },
    { id: USER_IDS.student7,  email: "hassan.butt@school.com",  password: "hashed_pw", role: "student" },
    { id: USER_IDS.student8,  email: "nadia.raza@school.com",   password: "hashed_pw", role: "student" },
    { id: USER_IDS.student9,  email: "imran.ali@school.com",    password: "hashed_pw", role: "student" },
    { id: USER_IDS.student10, email: "fatima.haq@school.com",   password: "hashed_pw", role: "student" },
    // teacher users
    { id: USER_IDS.teacher1,  email: "mr.khan@school.com",      password: "hashed_pw", role: "teacher" },
    { id: USER_IDS.teacher2,  email: "ms.jones@school.com",     password: "hashed_pw", role: "teacher" },
    { id: USER_IDS.teacher3,  email: "mr.ali@school.com",       password: "hashed_pw", role: "teacher" },
    { id: USER_IDS.teacher4,  email: "mrs.naz@school.com",      password: "hashed_pw", role: "teacher" },
    { id: USER_IDS.teacher5,  email: "mr.hasan@school.com",     password: "hashed_pw", role: "teacher" },
    // parent users
    { id: USER_IDS.parent1,   email: "khan.father@gmail.com",   password: "hashed_pw", role: "parent" },
    { id: USER_IDS.parent2,   email: "ahmed.mother@gmail.com",  password: "hashed_pw", role: "parent" },
    { id: USER_IDS.parent3,   email: "malik.father@gmail.com",  password: "hashed_pw", role: "parent" },
    { id: USER_IDS.parent4,   email: "iqbal.mother@gmail.com",  password: "hashed_pw", role: "parent" },
    // staff users
    { id: USER_IDS.staff1,    email: "hr.admin@school.com",     password: "hashed_pw", role: "staff" },
    { id: USER_IDS.staff2,    email: "finance.head@school.com", password: "hashed_pw", role: "staff" },
    { id: USER_IDS.staff3,    email: "librarian@school.com",    password: "hashed_pw", role: "staff" },
  ]).onConflictDoNothing();
  console.log("    ✓ users");

  // ── 2. SUBJECTS ─────────────────────────────────────────────────
  console.log("  inserting subjects…");
  await db.insert(subjects).values([
    { id: SUBJECT_IDS.math,          name: "Mathematics",      code: "MATH", description: "Core mathematics covering algebra, geometry and calculus" },
    { id: SUBJECT_IDS.english,       name: "English",          code: "ENG",  description: "English language and literature" },
    { id: SUBJECT_IDS.urdu,          name: "Urdu",             code: "URD",  description: "Urdu language and literature" },
    { id: SUBJECT_IDS.science,       name: "Science",          code: "SCI",  description: "General science for lower classes" },
    { id: SUBJECT_IDS.socialStudies, name: "Social Studies",   code: "SOC",  description: "History, geography and civics" },
    { id: SUBJECT_IDS.computerSci,   name: "Computer Science", code: "CS",   description: "Introduction to programming and IT" },
    { id: SUBJECT_IDS.physics,       name: "Physics",          code: "PHY",  description: "Mechanics, electricity and thermodynamics" },
    { id: SUBJECT_IDS.chemistry,     name: "Chemistry",        code: "CHM",  description: "Organic, inorganic and physical chemistry" },
    { id: SUBJECT_IDS.biology,       name: "Biology",          code: "BIO",  description: "Living systems, ecology and human anatomy" },
    { id: SUBJECT_IDS.economics,     name: "Economics",        code: "ECO",  description: "Micro and macro economics" },
  ]).onConflictDoNothing();
  console.log("    ✓ subjects");

  // ── 3. CLASSES ──────────────────────────────────────────────────
  // Create classes first (without teachers, as teachers don't exist yet)
  console.log("  inserting classes…");
  await db.insert(classes).values([
    {
      id: CLASS_IDS.class3A,
      classNumber: 3,
      section: "A",
      roomNumber: "101",
      academicYear: 2024,
      maxCapacity: 40,
      totalStudents: 0,
      studentIds: [],
      classSubjectsId: 3,
      description: "Class 3 Section A",
      isActive: 1,
    },
    {
      id: CLASS_IDS.class4A,
      classNumber: 4,
      section: "A",
      roomNumber: "102",
      academicYear: 2024,
      maxCapacity: 40,
      totalStudents: 0,
      studentIds: [],
      classSubjectsId: 4,
      description: "Class 4 Section A",
      isActive: 1,
    },
    {
      id: CLASS_IDS.class5A,
      classNumber: 5,
      section: "A",
      roomNumber: "103",
      academicYear: 2024,
      maxCapacity: 40,
      totalStudents: 0,
      studentIds: [],
      classSubjectsId: 5,
      description: "Class 5 Section A",
      isActive: 1,
    },
    {
      id: CLASS_IDS.class6A,
      classNumber: 6,
      section: "A",
      roomNumber: "104",
      academicYear: 2024,
      maxCapacity: 40,
      totalStudents: 0,
      studentIds: [],
      classSubjectsId: 6,
      description: "Class 6 Section A",
      isActive: 1,
    },
  ]).onConflictDoNothing();
  console.log("    ✓ classes");

  // ── 4. CLASS_SUBJECTS ───────────────────────────────────────────
  // Maps each class to the UUID array of its subjects.
  console.log("  inserting class_subjects…");

  const base1_2   = [SUBJECT_IDS.math, SUBJECT_IDS.english, SUBJECT_IDS.urdu, SUBJECT_IDS.science, SUBJECT_IDS.socialStudies];
  const base3_5   = [...base1_2, SUBJECT_IDS.computerSci];
  const base6_7   = [SUBJECT_IDS.math, SUBJECT_IDS.english, SUBJECT_IDS.urdu, SUBJECT_IDS.physics, SUBJECT_IDS.chemistry, SUBJECT_IDS.socialStudies, SUBJECT_IDS.computerSci];
  const base8_10  = [SUBJECT_IDS.math, SUBJECT_IDS.english, SUBJECT_IDS.urdu, SUBJECT_IDS.physics, SUBJECT_IDS.chemistry, SUBJECT_IDS.biology, SUBJECT_IDS.computerSci];
  const base11_12 = [...base8_10, SUBJECT_IDS.economics];

  await db.insert(classSubjects).values([
    { classNumber: 1,  subjectsId: base1_2 },
    { classNumber: 2,  subjectsId: base1_2 },
    { classNumber: 3,  subjectsId: base3_5 },
    { classNumber: 4,  subjectsId: base3_5 },
    { classNumber: 5,  subjectsId: base3_5 },
    { classNumber: 6,  subjectsId: base6_7 },
    { classNumber: 7,  subjectsId: base6_7 },
    { classNumber: 8,  subjectsId: base8_10 },
    { classNumber: 9,  subjectsId: base8_10 },
    { classNumber: 10, subjectsId: base8_10 },
    { classNumber: 11, subjectsId: base11_12 },
    { classNumber: 12, subjectsId: base11_12 },
  ]).onConflictDoNothing();
  console.log("    ✓ class_subjects");

  // ── 5. STUDENTS ─────────────────────────────────────────────────
  // Create students and assign them to classes
  console.log("  inserting students…");
  await db.insert(students).values([
    { id: STUDENT_ROW_IDS.student1,  userId: USER_IDS.student1,  studentRoll: "STU-001", name: "Ali Khan",     classId: CLASS_IDS.class5A, enrollmentYear: 2021, emergencyNumber: "+92-300-1111111", address: "123 Main St, Karachi", bloodGroup: "A+",  gender: "Male",   dateOfBirth: new Date("2014-03-15") },
    { id: STUDENT_ROW_IDS.student2,  userId: USER_IDS.student2,  studentRoll: "STU-002", name: "Sara Ahmed",   classId: CLASS_IDS.class5A, enrollmentYear: 2021, emergencyNumber: "+92-300-2222222", address: "45 Gulberg Ave, Lahore", bloodGroup: "B+",  gender: "Female", dateOfBirth: new Date("2014-07-22") },
    { id: STUDENT_ROW_IDS.student3,  userId: USER_IDS.student3,  studentRoll: "STU-003", name: "Omar Malik",   classId: CLASS_IDS.class4A, enrollmentYear: 2022, emergencyNumber: "+92-300-3333333", address: "78 Defence Rd, Islamabad", bloodGroup: "O+", gender: "Male",   dateOfBirth: new Date("2015-01-10") },
    { id: STUDENT_ROW_IDS.student4,  userId: USER_IDS.student4,  studentRoll: "STU-004", name: "Zara Iqbal",   classId: CLASS_IDS.class4A, enrollmentYear: 2022, emergencyNumber: "+92-300-4444444", address: "9 Johar Town, Lahore", bloodGroup: "A-",   gender: "Female", dateOfBirth: new Date("2015-05-18") },
    { id: STUDENT_ROW_IDS.student5,  userId: USER_IDS.student5,  studentRoll: "STU-005", name: "Yusuf Naqvi",  classId: CLASS_IDS.class6A, enrollmentYear: 2020, emergencyNumber: "+92-300-5555555", address: "200 Clifton, Karachi", bloodGroup: "B-",   gender: "Male",   dateOfBirth: new Date("2013-11-30") },
    { id: STUDENT_ROW_IDS.student6,  userId: USER_IDS.student6,  studentRoll: "STU-006", name: "Leila Shah",   classId: CLASS_IDS.class6A, enrollmentYear: 2020, emergencyNumber: "+92-300-6666666", address: "55 F-6, Islamabad", bloodGroup: "AB+",  gender: "Female", dateOfBirth: new Date("2013-08-14") },
    { id: STUDENT_ROW_IDS.student7,  userId: USER_IDS.student7,  studentRoll: "STU-007", name: "Hassan Butt",  classId: CLASS_IDS.class3A, enrollmentYear: 2023, emergencyNumber: "+92-300-7777777", address: "10 Iqbal Park, Faisalabad", bloodGroup: "O-", gender: "Male",   dateOfBirth: new Date("2016-02-28") },
    { id: STUDENT_ROW_IDS.student8,  userId: USER_IDS.student8,  studentRoll: "STU-008", name: "Nadia Raza",   classId: CLASS_IDS.class3A, enrollmentYear: 2023, emergencyNumber: "+92-300-8888888", address: "88 Ravi Town, Lahore", bloodGroup: "A+",   gender: "Female", dateOfBirth: new Date("2016-06-05") },
    { id: STUDENT_ROW_IDS.student9,  userId: USER_IDS.student9,  studentRoll: "STU-009", name: "Imran Ali",    classId: CLASS_IDS.class5A, enrollmentYear: 2021, emergencyNumber: "+92-300-9999999", address: "33 Gulshan-e-Iqbal, Karachi", bloodGroup: "B+", gender: "Male", dateOfBirth: new Date("2014-12-01") },
    { id: STUDENT_ROW_IDS.student10, userId: USER_IDS.student10, studentRoll: "STU-010", name: "Fatima Haq",   classId: CLASS_IDS.class4A, enrollmentYear: 2022, emergencyNumber: "+92-300-0000000", address: "17 Wah Cantt", bloodGroup: "AB-", gender: "Female", dateOfBirth: new Date("2015-09-19") },
  ]).onConflictDoNothing();
  console.log("    ✓ students");

  // ── 6. UPDATE CLASSES WITH STUDENT IDS ──────────────────────────
  console.log("  updating classes with student IDs…");
  
  // Class 3A students
  await db.update(classes)
    .set({
      studentIds: [STUDENT_ROW_IDS.student7, STUDENT_ROW_IDS.student8],
      totalStudents: 2,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, CLASS_IDS.class3A));

  // Class 4A students
  await db.update(classes)
    .set({
      studentIds: [STUDENT_ROW_IDS.student3, STUDENT_ROW_IDS.student4, STUDENT_ROW_IDS.student10],
      totalStudents: 3,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, CLASS_IDS.class4A));

  // Class 5A students
  await db.update(classes)
    .set({
      studentIds: [STUDENT_ROW_IDS.student1, STUDENT_ROW_IDS.student2, STUDENT_ROW_IDS.student9],
      totalStudents: 3,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, CLASS_IDS.class5A));

  // Class 6A students
  await db.update(classes)
    .set({
      studentIds: [STUDENT_ROW_IDS.student5, STUDENT_ROW_IDS.student6],
      totalStudents: 2,
      updatedAt: new Date(),
    })
    .where(eq(classes.id, CLASS_IDS.class6A));

  console.log("    ✓ classes updated");

  // ── 7. TEACHERS ─────────────────────────────────────────────────
  // Create teachers with classTeacherOfId (class UUID instead of class number)
  console.log("  inserting teachers…");
  await db.insert(teachers).values([
    { 
      id: TEACHER_IDS.teacher1, 
      userId: USER_IDS.teacher1, 
      employeeId: "TCH-001", 
      department: "Mathematics", 
      subjectId: SUBJECT_IDS.math,        
      name: "Mr. Kamran Khan",    
      gender: "Male",   
      classTeacherOfId: CLASS_IDS.class5A, 
      phoneNumber: "+92-311-1111111", 
      address: "1 Teachers Colony, Lahore",    
      joiningDate: new Date("2019-08-01"), 
      salary: "75000" 
    },
    { 
      id: TEACHER_IDS.teacher2, 
      userId: USER_IDS.teacher2, 
      employeeId: "TCH-002", 
      department: "Languages",   
      subjectId: SUBJECT_IDS.english,     
      name: "Ms. Rebecca Jones",  
      gender: "Female", 
      classTeacherOfId: CLASS_IDS.class4A, 
      phoneNumber: "+92-311-2222222", 
      address: "12 International Lane, Islamabad", 
      joiningDate: new Date("2020-01-15"), 
      salary: "80000" 
    },
    { 
      id: TEACHER_IDS.teacher3, 
      userId: USER_IDS.teacher3, 
      employeeId: "TCH-003", 
      department: "Sciences",    
      subjectId: SUBJECT_IDS.science,     
      name: "Mr. Tariq Ali",     
      gender: "Male",   
      classTeacherOfId: CLASS_IDS.class3A, 
      phoneNumber: "+92-311-3333333", 
      address: "5 Science Park, Karachi",      
      joiningDate: new Date("2018-06-10"), 
      salary: "70000" 
    },
    { 
      id: TEACHER_IDS.teacher4, 
      userId: USER_IDS.teacher4, 
      employeeId: "TCH-004", 
      department: "Languages",   
      subjectId: SUBJECT_IDS.urdu,        
      name: "Mrs. Ayesha Naz",   
      gender: "Female", 
      classTeacherOfId: CLASS_IDS.class6A, 
      phoneNumber: "+92-311-4444444", 
      address: "22 Urdu Rd, Lahore",          
      joiningDate: new Date("2021-03-20"), 
      salary: "72000" 
    },
    { 
      id: TEACHER_IDS.teacher5, 
      userId: USER_IDS.teacher5, 
      employeeId: "TCH-005", 
      department: "Technology",  
      subjectId: SUBJECT_IDS.computerSci, 
      name: "Mr. Bilal Hasan",   
      gender: "Male",   
      classTeacherOfId: null,  // Not a class teacher
      phoneNumber: "+92-311-5555555", 
      address: "40 Tech Avenue, Karachi",      
      joiningDate: new Date("2022-07-01"), 
      salary: "68000" 
    },
  ]).onConflictDoNothing();
  console.log("    ✓ teachers");

  // ── 8. UPDATE CLASSES WITH TEACHER IDS ──────────────────────────
  console.log("  updating classes with teacher IDs…");
  
  await db.update(classes)
    .set({ classTeacherId: TEACHER_IDS.teacher3, updatedAt: new Date() })
    .where(eq(classes.id, CLASS_IDS.class3A));

  await db.update(classes)
    .set({ classTeacherId: TEACHER_IDS.teacher2, updatedAt: new Date() })
    .where(eq(classes.id, CLASS_IDS.class4A));

  await db.update(classes)
    .set({ classTeacherId: TEACHER_IDS.teacher1, updatedAt: new Date() })
    .where(eq(classes.id, CLASS_IDS.class5A));

  await db.update(classes)
    .set({ classTeacherId: TEACHER_IDS.teacher4, updatedAt: new Date() })
    .where(eq(classes.id, CLASS_IDS.class6A));

  console.log("    ✓ classes updated with teachers");

  // ── 9. PARENTS ──────────────────────────────────────────────────
  console.log("  inserting parents…");
  await db.insert(parents).values([
    { id: crypto.randomUUID(), userId: USER_IDS.parent1, phoneNumber: "+92-321-1111111", address: "123 Main St, Karachi",       guardianName: "Mohammad Khan",  name: "Mohammad Khan",  gender: "Male" },
    { id: crypto.randomUUID(), userId: USER_IDS.parent2, phoneNumber: "+92-321-2222222", address: "45 Gulberg Ave, Lahore",     guardianName: "Fauzia Ahmed",   name: "Fauzia Ahmed",   gender: "Female" },
    { id: crypto.randomUUID(), userId: USER_IDS.parent3, phoneNumber: "+92-321-3333333", address: "78 Defence Rd, Islamabad",   guardianName: "Tahir Malik",    name: "Tahir Malik",    gender: "Male" },
    { id: crypto.randomUUID(), userId: USER_IDS.parent4, phoneNumber: "+92-321-4444444", address: "9 Johar Town, Lahore",       guardianName: "Raheela Iqbal",  name: "Raheela Iqbal",  gender: "Female" },
  ]).onConflictDoNothing();
  console.log("    ✓ parents");

  // ── 10. STAFF ───────────────────────────────────────────────────
  console.log("  inserting staff…");
  await db.insert(staff).values([
    { id: crypto.randomUUID(), userId: USER_IDS.staff1, employeeId: "STF-001", department: "HR",      roleDetails: "Human Resources Officer", name: "Shaheen Begum",  phoneNumber: "+92-331-1111111", address: "10 HR Lane, Lahore",     joiningDate: new Date("2018-01-10"), salary: "65000", gender: "Female" },
    { id: crypto.randomUUID(), userId: USER_IDS.staff2, employeeId: "STF-002", department: "Finance", roleDetails: "Finance Head",           name: "Rashid Pasha",   phoneNumber: "+92-331-2222222", address: "20 Finance Blvd, Karachi", joiningDate: new Date("2017-05-22"), salary: "78000", gender: "Male" },
    { id: crypto.randomUUID(), userId: USER_IDS.staff3, employeeId: "STF-003", department: "Library", roleDetails: "Head Librarian",         name: "Nasreen Fatima", phoneNumber: "+92-331-3333333", address: "5 Book Ave, Islamabad",   joiningDate: new Date("2020-09-01"), salary: "58000", gender: "Female" },
  ]).onConflictDoNothing();
  console.log("    ✓ staff");

  // ── 11. STUDENT_GRADES ──────────────────────────────────────────
  // Seed historical grades so getStudentOverall has multi-year data.
  console.log("  inserting student_grades…");

  // Helper to build marks object
  const marks = (m: number, t: number) => ({ obtainedMarks: m, totalMarks: t });

  // ─ Ali Khan – class 3, year 2022 ─
  const ali_c3: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(82, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(78, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(85, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(80, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(75, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(88, 100) },
  ];
  // ─ Ali Khan – class 4, year 2023 ─
  const ali_c4: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(88, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(82, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(90, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(85, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(79, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(92, 100) },
  ];
  // ─ Ali Khan – class 5, year 2024 ─
  const ali_c5: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(95, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(88, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(92, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(97, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(83, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(100, 100) },
  ];

  // ─ Sara Ahmed – class 3, year 2022 ─
  const sara_c3: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(90, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(95, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(88, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(92, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(87, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(85, 100) },
  ];
  // ─ Sara Ahmed – class 4, year 2023 ─
  const sara_c4: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(92, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(96, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(89, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(94, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(91, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(87, 100) },
  ];
  // ─ Sara Ahmed – class 5, year 2024 ─
  const sara_c5: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(94, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(98, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(91, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(96, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(93, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(89, 100) },
  ];

  // ─ Yusuf Naqvi – class 3 (2020), 4 (2021), 5 (2022), 6 (2023) ─
  const yusuf_c3: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(70, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(65, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(72, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(68, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(74, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(80, 100) },
  ];
  const yusuf_c4: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(75, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(70, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(78, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(72, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(76, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(82, 100) },
  ];
  const yusuf_c5: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(80, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(75, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(82, 100) },
    { subject: SUBJECT_IDS.science,       ...marks(78, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(81, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(85, 100) },
  ];
  // class 6 has 7 subjects
  const yusuf_c6: any[] = [
    { subject: SUBJECT_IDS.math,          ...marks(83, 100) },
    { subject: SUBJECT_IDS.english,       ...marks(78, 100) },
    { subject: SUBJECT_IDS.urdu,          ...marks(85, 100) },
    { subject: SUBJECT_IDS.physics,       ...marks(76, 100) },
    { subject: SUBJECT_IDS.chemistry,     ...marks(74, 100) },
    { subject: SUBJECT_IDS.socialStudies, ...marks(80, 100) },
    { subject: SUBJECT_IDS.computerSci,   ...marks(88, 100) },
  ];

  // Helper — builds the cached summary fields from a subjects array
  function summary(subs: { obtainedMarks: number; totalMarks: number }[]) {
    const totalObtained = subs.reduce((s, x) => s + x.obtainedMarks, 0);
    const totalMarks    = subs.reduce((s, x) => s + x.totalMarks, 0);
    const percentage    = parseFloat(((totalObtained / totalMarks) * 100).toFixed(2));
    let grade: string;
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C";
    else if (percentage >= 40) grade = "D";
    else grade = "F";

    return {
      totalObtained: totalObtained.toString(),
      totalMarks:    totalMarks.toString(),
      percentage:    percentage.toString(),
      grade,
    };
  }

  await db.insert(studentGrades).values([
    // Ali Khan
    { studentId: STUDENT_ROW_IDS.student1, classNumber: 3, year: 2022, subjectsName: JSON.stringify(ali_c3), ...summary(ali_c3) },
    { studentId: STUDENT_ROW_IDS.student1, classNumber: 4, year: 2023, subjectsName: JSON.stringify(ali_c4), ...summary(ali_c4) },
    { studentId: STUDENT_ROW_IDS.student1, classNumber: 5, year: 2024, subjectsName: JSON.stringify(ali_c5), ...summary(ali_c5) },
    // Sara Ahmed
    { studentId: STUDENT_ROW_IDS.student2, classNumber: 3, year: 2022, subjectsName: JSON.stringify(sara_c3), ...summary(sara_c3) },
    { studentId: STUDENT_ROW_IDS.student2, classNumber: 4, year: 2023, subjectsName: JSON.stringify(sara_c4), ...summary(sara_c4) },
    { studentId: STUDENT_ROW_IDS.student2, classNumber: 5, year: 2024, subjectsName: JSON.stringify(sara_c5), ...summary(sara_c5) },
    // Yusuf Naqvi
    { studentId: STUDENT_ROW_IDS.student5, classNumber: 3, year: 2020, subjectsName: JSON.stringify(yusuf_c3), ...summary(yusuf_c3) },
    { studentId: STUDENT_ROW_IDS.student5, classNumber: 4, year: 2021, subjectsName: JSON.stringify(yusuf_c4), ...summary(yusuf_c4) },
    { studentId: STUDENT_ROW_IDS.student5, classNumber: 5, year: 2022, subjectsName: JSON.stringify(yusuf_c5), ...summary(yusuf_c5) },
    { studentId: STUDENT_ROW_IDS.student5, classNumber: 6, year: 2023, subjectsName: JSON.stringify(yusuf_c6), ...summary(yusuf_c6) },
  ]).onConflictDoNothing();
  console.log("    ✓ student_grades");

  console.log("\n✅  Seed complete.\n");
  console.log("📊  Summary:");
  console.log(`    • 4 Classes created (3A, 4A, 5A, 6A)`);
  console.log(`    • 10 Students distributed across classes`);
  console.log(`    • 5 Teachers (4 assigned as class teachers)`);
  console.log(`    • 10 Subjects across all grade levels`);
  console.log(`    • Historical grades for 3 students\n`);
  
  console.log("🔍  Quick-test IDs:");
  console.log(`    Class 5A      → ${CLASS_IDS.class5A}`);
  console.log(`    Ali Khan      → ${STUDENT_ROW_IDS.student1}  (3 years of grades)`);
  console.log(`    Sara Ahmed    → ${STUDENT_ROW_IDS.student2}  (3 years of grades)`);
  console.log(`    Yusuf Naqvi   → ${STUDENT_ROW_IDS.student5}  (4 years of grades)`);
  console.log(`    Mr. Khan      → ${TEACHER_IDS.teacher1}  (Class 5A teacher)\n`);

  process.exit(0);
}

// Import eq function
import { eq } from "drizzle-orm";

seed().catch((err) => {
  console.error("\n❌  Seed failed:", err);
  process.exit(1);
});