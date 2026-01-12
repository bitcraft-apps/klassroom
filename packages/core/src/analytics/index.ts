// Grade statistics
export {
  countGradesByType,
  countGradesBySubject,
  parseNumericGrade,
  emptyGradeCounts,
} from './grades.js';

// Student statistics
export {
  calculateClassAverage,
  calculateMinMaxAverage,
  calculateSubjectAverages,
  getTopStudents,
  countStudentsByAverageRange,
  HONORS_THRESHOLD,
} from './students.js';

// Behavior statistics
export { countBehaviorGrades } from './behavior.js';

// Subject enrollment statistics
export { countStudentsBySubject, getOptionalSubjects } from './subjects.js';
