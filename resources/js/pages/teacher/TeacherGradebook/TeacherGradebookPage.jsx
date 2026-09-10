import { motion } from 'motion/react';
import TeacherGradebook from './TeacherGradebook';

const TeacherGradebookPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="w-full"
  >
    <TeacherGradebook />
  </motion.div>
);

export default TeacherGradebookPage;
