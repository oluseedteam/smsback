import { motion } from 'motion/react';
import TeacherStudents from './TeacherStudents';

const TeacherStudentsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <TeacherStudents />
    </motion.div>
  );
};

export default TeacherStudentsPage;
