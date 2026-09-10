import { motion } from 'motion/react';
import TeacherAssignments from './TeacherAssignments';

const TeacherAssignmentsPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherAssignments />
  </motion.div>
);

export default TeacherAssignmentsPage;
