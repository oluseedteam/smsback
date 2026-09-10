import { motion } from 'motion/react';
import TeacherMyClasses from './TeacherMyClasses';

const TeacherMyClassesPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className="w-full"
    >
      <TeacherMyClasses />
    </motion.div>
  );
};

export default TeacherMyClassesPage;
